'use client';

import React, { useState, useEffect } from 'react';
import { TileData } from './CSVTable';
import { GridCell } from './MainGridEnhanced';
import { 
  optimizeWithPreset, 
  optimizeForSingleColor,
  optimizeGridConfigurable 
} from '@/lib/coreFunctions/optimizationEngine';
import { OPTIMIZATION_PRESETS } from '@/lib/coreFunctions/optimizationConfig';
import TileRenderer from './TileRenderer';

interface PatternOptimizationShowcaseProps {
  allTiles: TileData[];
  customColors: { a: string; b: string; c: string; d: string };
}

interface PatternPreview {
  name: string;
  description: string;
  grid: GridCell[];
  stats: {
    swaps: number;
    iterations: number;
    executionTime: number;
    converged: boolean;
  };
}

export default function PatternOptimizationShowcase({ 
  allTiles, 
  customColors 
}: PatternOptimizationShowcaseProps) {
  const [selectedPattern, setSelectedPattern] = useState<string>('row-major');
  const [currentGrid, setCurrentGrid] = useState<GridCell[]>([]);
  const [patternPreviews, setPatternPreviews] = useState<PatternPreview[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // Initialize empty grid
  useEffect(() => {
    const initialGrid: GridCell[] = [];
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 12; x++) {
        initialGrid.push({ x, y });
      }
    }
    
    // Fill with random tiles for visualization
    if (allTiles.length === 96) {
      const shuffledTiles = [...allTiles].sort(() => Math.random() - 0.5);
      for (let i = 0; i < Math.min(shuffledTiles.length, initialGrid.length); i++) {
        initialGrid[i] = {
          ...initialGrid[i],
          tile: shuffledTiles[i]
        };
      }
    }
    
    setCurrentGrid(initialGrid);
  }, [allTiles]);

  const runPatternOptimization = (pattern: string) => {
    if (isGenerating || allTiles.length !== 96) return;
    
    setIsGenerating(true);
    setSelectedPattern(pattern);
    
    try {
      let result;
      let name = '';
      let description = '';
      
      // Reset grid with all tiles
      const baseGrid: GridCell[] = [];
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 12; x++) {
          baseGrid.push({ x, y });
        }
      }
      const shuffledTiles = [...allTiles].sort(() => Math.random() - 0.5);
      for (let i = 0; i < Math.min(shuffledTiles.length, baseGrid.length); i++) {
        baseGrid[i] = {
          ...baseGrid[i],
          tile: shuffledTiles[i]
        };
      }
      
      switch (pattern) {
        case 'row-major':
          name = 'Row Major';
          description = 'Left-to-right, top-to-bottom traversal';
          result = optimizeGridConfigurable(baseGrid, allTiles, {
            traversal: 'row-major',
            maxIterations: 1
          });
          break;
          
        case 'column-major':
          name = 'Column Major';
          description = 'Top-to-bottom, left-to-right traversal';
          result = optimizeGridConfigurable(baseGrid, allTiles, {
            traversal: 'column-major',
            maxIterations: 1
          });
          break;
          
        case 'spiral-clockwise':
          name = 'Spiral Clockwise';
          description = 'Spiral pattern from outside to center';
          result = optimizeGridConfigurable(baseGrid, allTiles, {
            traversal: 'spiral-clockwise',
            maxIterations: 1
          });
          break;
          
        case 'spiral-counter':
          name = 'Spiral Counter';
          description = 'Counter-clockwise spiral pattern';
          result = optimizeGridConfigurable(baseGrid, allTiles, {
            traversal: 'spiral-counter',
            maxIterations: 1
          });
          break;
          
        case 'diagonal':
          name = 'Diagonal Sweeps';
          description = 'Diagonal traversal from top-left to bottom-right';
          result = optimizeGridConfigurable(baseGrid, allTiles, {
            traversal: 'diagonal',
            maxIterations: 1
          });
          break;
          
        case 'block-2x2':
          name = '2x2 Blocks';
          description = 'Process grid in 2x2 block sections';
          result = optimizeGridConfigurable(baseGrid, allTiles, {
            traversal: 'block-2x2',
            maxIterations: 1
          });
          break;
          
        case 'checkerboard':
          name = 'Checkerboard';
          description = 'Alternating checkerboard pattern';
          result = optimizeGridConfigurable(baseGrid, allTiles, {
            traversal: 'checkerboard',
            maxIterations: 1
          });
          break;
          
        case 'random-walk':
          name = 'Random Walk';
          description = 'Random traversal pattern';
          result = optimizeGridConfigurable(baseGrid, allTiles, {
            traversal: 'random-walk',
            maxIterations: 1
          });
          break;
          
        case 'edge-focused':
          name = 'Edge Focused';
          description = 'Prioritize edge matching';
          result = optimizeWithPreset(baseGrid, allTiles, 'edgeFocused');
          break;
          
        case 'mirror-heavy':
          name = 'Mirror Heavy';
          description = 'Prioritize mirror relationships';
          result = optimizeWithPreset(baseGrid, allTiles, 'mirrorHeavy');
          break;
          
        case 'shape-clustered':
          name = 'Shape Clustered';
          description = 'Group similar shapes together';
          result = optimizeWithPreset(baseGrid, allTiles, 'shapeClustered');
          break;
          
        case 'color-a':
          name = 'Color A Priority';
          description = 'Optimize for color A matching';
          result = optimizeForSingleColor(baseGrid, allTiles, 'a');
          break;
          
        default:
          name = 'Classic';
          description = 'Default optimization';
          result = optimizeWithPreset(baseGrid, allTiles, 'classic');
      }
      
      setCurrentGrid(result.grid);
      
      // If comparison mode, add to previews
      if (showComparison) {
        setPatternPreviews(prev => [...prev, {
          name,
          description,
          grid: result.grid,
          stats: {
            swaps: result.swaps,
            iterations: result.iterations,
            executionTime: result.executionTime,
            converged: result.converged
          }
        }]);
      }
      
    } catch (error) {
      console.error('Pattern optimization failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAllPatterns = async () => {
    if (isGenerating || allTiles.length !== 96) return;
    
    setIsGenerating(true);
    setPatternPreviews([]);
    setShowComparison(true);
    
    const patterns = [
      'row-major', 'column-major', 'spiral-clockwise', 'block-2x2',
      'diagonal', 'checkerboard', 'edge-focused', 'mirror-heavy'
    ];
    
    for (const pattern of patterns) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for UI update
      runPatternOptimization(pattern);
    }
    
    setIsGenerating(false);
  };

  const clearComparison = () => {
    setPatternPreviews([]);
    setShowComparison(false);
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-4">Pattern Optimization Showcase</h2>
        <p className="text-gray-300 text-sm mb-4">
          Visualize how different optimization patterns arrange the tiles
        </p>
      </div>

      {/* Control Panel */}
      <div className="bg-gray-700 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={selectedPattern}
            onChange={(e) => setSelectedPattern(e.target.value)}
            disabled={isGenerating}
            className="px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
          >
            <optgroup label="Traversal Patterns">
              <option value="row-major">Row Major (Default)</option>
              <option value="column-major">Column Major</option>
              <option value="spiral-clockwise">Spiral Clockwise</option>
              <option value="spiral-counter">Spiral Counter-Clockwise</option>
              <option value="diagonal">Diagonal Sweeps</option>
              <option value="block-2x2">2x2 Blocks</option>
              <option value="checkerboard">Checkerboard</option>
              <option value="random-walk">Random Walk</option>
            </optgroup>
            <optgroup label="Optimization Presets">
              <option value="edge-focused">Edge Focused</option>
              <option value="mirror-heavy">Mirror Heavy</option>
              <option value="shape-clustered">Shape Clustered</option>
              <option value="color-a">Color A Priority</option>
            </optgroup>
          </select>

          <button
            onClick={() => runPatternOptimization(selectedPattern)}
            disabled={isGenerating}
            className={`px-4 py-2 text-white rounded-lg font-semibold transition-all duration-200
              ${isGenerating 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-blue-700 hover:bg-blue-600 hover:scale-[1.02] active:scale-[0.98]'}`}
          >
            {isGenerating ? '⏳ Generating...' : '🎨 Generate Pattern'}
          </button>

          <button
            onClick={() => setShowComparison(!showComparison)}
            className={`px-4 py-2 text-white rounded-lg font-semibold transition-all duration-200
              ${showComparison 
                ? 'bg-yellow-700 hover:bg-yellow-600' 
                : 'bg-purple-700 hover:bg-purple-600'} 
              hover:scale-[1.02] active:scale-[0.98]`}
          >
            {showComparison ? '📊 Hide Comparison' : '📊 Compare Patterns'}
          </button>

          {showComparison && (
            <>
              <button
                onClick={generateAllPatterns}
                disabled={isGenerating}
                className={`px-4 py-2 text-white rounded-lg font-semibold transition-all duration-200
                  ${isGenerating 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-green-700 hover:bg-green-600 hover:scale-[1.02] active:scale-[0.98]'}`}
              >
                {isGenerating ? '⏳ Generating All...' : '🚀 Generate All Patterns'}
              </button>
              
              <button
                onClick={clearComparison}
                className="px-4 py-2 bg-red-700 text-white rounded-lg font-semibold
                         hover:bg-red-600 transition-all duration-200 
                         hover:scale-[1.02] active:scale-[0.98]"
              >
                🗑️ Clear Comparison
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Visualization */}
      {!showComparison && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">
            Current Pattern: {selectedPattern.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </h3>
          <div className="bg-gray-900 p-4 rounded-lg">
            <div className="grid grid-cols-12 gap-0 border-2 border-gray-600">
              {currentGrid.map((cell, index) => (
                <div
                  key={`${cell.x}-${cell.y}`}
                  className="aspect-square border border-gray-700"
                >
                  {cell.tile && (
                    <TileRenderer
                      tile={cell.tile}
                      customColors={customColors}
                      size={20}
                      seamless={true}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Comparison Grid */}
      {showComparison && patternPreviews.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Pattern Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patternPreviews.map((preview, idx) => (
              <div key={idx} className="bg-gray-900 p-3 rounded-lg">
                <h4 className="text-white font-semibold text-sm mb-1">{preview.name}</h4>
                <p className="text-gray-400 text-xs mb-2">{preview.description}</p>
                
                {/* Mini Grid */}
                <div className="grid grid-cols-12 gap-0 border border-gray-600 mb-2">
                  {preview.grid.map((cell, cellIdx) => (
                    <div
                      key={`${idx}-${cellIdx}`}
                      className="aspect-square border border-gray-800"
                      style={{ borderWidth: '0.5px' }}
                    >
                      {cell.tile && (
                        <div style={{ width: '100%', height: '100%', transform: 'scale(0.8)' }}>
                          <TileRenderer
                            tile={cell.tile}
                            customColors={customColors}
                            size={12}
                            seamless={true}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Stats */}
                <div className="text-xs text-gray-400">
                  <span className="mr-2">⚡ {preview.stats.swaps} swaps</span>
                  <span className="mr-2">🔄 {preview.stats.iterations} iter</span>
                  <span>⏱️ {preview.stats.executionTime.toFixed(0)}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pattern Descriptions */}
      <div className="mt-6 p-4 bg-gray-700 rounded-lg">
        <h4 className="text-white font-semibold mb-3">📚 Pattern Descriptions</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-300">
          <div>
            <span className="font-semibold text-blue-400">Row Major:</span> Traditional left-to-right scanning
          </div>
          <div>
            <span className="font-semibold text-blue-400">Column Major:</span> Vertical column-by-column processing
          </div>
          <div>
            <span className="font-semibold text-blue-400">Spiral:</span> Circular pattern from edge to center
          </div>
          <div>
            <span className="font-semibold text-blue-400">2x2 Blocks:</span> Process in square block groups
          </div>
          <div>
            <span className="font-semibold text-blue-400">Diagonal:</span> Diagonal sweep patterns
          </div>
          <div>
            <span className="font-semibold text-blue-400">Checkerboard:</span> Alternating position processing
          </div>
        </div>
      </div>
    </div>
  );
}