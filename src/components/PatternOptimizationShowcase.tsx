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
  // Separate state for the three dropdown categories
  const [selectedPositioning, setSelectedPositioning] = useState<string>('row-major');
  const [selectedModule, setSelectedModule] = useState<string>('edge-focused');
  const [showTiles, setShowTiles] = useState<boolean>(true);
  const [animationSpeed, setAnimationSpeed] = useState<number>(500); // milliseconds between steps
  
  const [currentGrid, setCurrentGrid] = useState<GridCell[]>([]);
  const [patternPreviews, setPatternPreviews] = useState<PatternPreview[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);

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

  // Animation effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isAnimating && currentGrid.length > 0) {
      intervalId = setInterval(() => {
        setAnimationStep(prev => {
          const next = prev + 1;
          if (next >= currentGrid.length) {
            setIsAnimating(false);
            return 0;
          }
          return next;
        });
      }, animationSpeed);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAnimating, animationSpeed, currentGrid.length]);

  const runPatternOptimization = () => {
    if (isGenerating || allTiles.length !== 96) return;
    
    // Combine positioning and module selections
    const pattern = selectedPositioning;
    const module = selectedModule;
    
    setIsGenerating(true);
    
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
      
      // Determine optimization preset based on module selection
      let presetConfig: any = {};
      switch (module) {
        case 'edge-focused':
          presetConfig = { weights: { edgeMatching: 100, mirrorBonus: 10, shapeCluster: 5 } };
          break;
        case 'mirror-heavy':
          presetConfig = { weights: { edgeMatching: 5, mirrorBonus: 300, rotationBonus: 50, shapeCluster: 10 } };
          break;
        case 'shape-clustered':
          presetConfig = { weights: { edgeMatching: 10, mirrorBonus: 20, shapeCluster: 100 } };
          break;
        default:
          presetConfig = { weights: { edgeMatching: 10, mirrorBonus: 100, rotationBonus: 50, shapeCluster: 20 } };
      }

      // Apply positioning traversal pattern
      switch (pattern) {
        case 'row-major':
          name = 'Row Major + ' + module;
          description = 'Left-to-right, top-to-bottom traversal with ' + module + ' optimization';
          result = optimizeGridConfigurable(baseGrid, allTiles, {
            ...presetConfig,
            traversal: 'row-major',
            maxIterations: 1
          });
          break;
          
        case 'column-major':
          name = 'Column Major + ' + module;
          description = 'Top-to-bottom, left-to-right traversal with ' + module + ' optimization';
          result = optimizeGridConfigurable(baseGrid, allTiles, {
            ...presetConfig,
            traversal: 'column-major',
            maxIterations: 1
          });
          break;
          
        case 'spiral-clockwise':
          name = 'Spiral Clockwise + ' + module;
          description = 'Spiral pattern from outside to center with ' + module + ' optimization';
          result = optimizeGridConfigurable(baseGrid, allTiles, {
            ...presetConfig,
            traversal: 'spiral-clockwise',
            maxIterations: 1
          });
          break;
          
        case 'spiral-counter':
          name = 'Spiral Counter + ' + module;
          description = 'Counter-clockwise spiral pattern with ' + module + ' optimization';
          result = optimizeGridConfigurable(baseGrid, allTiles, {
            ...presetConfig,
            traversal: 'spiral-counter',
            maxIterations: 1
          });
          break;
          
        case 'diagonal':
          name = 'Diagonal Sweeps + ' + module;
          description = 'Diagonal traversal from top-left to bottom-right with ' + module + ' optimization';
          result = optimizeGridConfigurable(baseGrid, allTiles, {
            ...presetConfig,
            traversal: 'diagonal',
            maxIterations: 1
          });
          break;
          
        case 'block-2x2':
          name = '2x2 Blocks + ' + module;
          description = 'Process grid in 2x2 block sections with ' + module + ' optimization';
          result = optimizeGridConfigurable(baseGrid, allTiles, {
            ...presetConfig,
            traversal: 'block-2x2',
            maxIterations: 1
          });
          break;
          
        case 'checkerboard':
          name = 'Checkerboard + ' + module;
          description = 'Alternating checkerboard pattern with ' + module + ' optimization';
          result = optimizeGridConfigurable(baseGrid, allTiles, {
            ...presetConfig,
            traversal: 'checkerboard',
            maxIterations: 1
          });
          break;
          
        case 'random-walk':
          name = 'Random Walk + ' + module;
          description = 'Random traversal pattern with ' + module + ' optimization';
          result = optimizeGridConfigurable(baseGrid, allTiles, {
            ...presetConfig,
            traversal: 'random-walk',
            maxIterations: 1
          });
          break;
          
        default:
          name = 'Classic + ' + module;
          description = 'Default optimization with ' + module + ' module';
          result = optimizeGridConfigurable(baseGrid, allTiles, {
            ...presetConfig,
            traversal: 'row-major',
            maxIterations: 1
          });
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
    
    const positionings = ['row-major', 'column-major', 'spiral-clockwise', 'block-2x2'];
    const modules = ['edge-focused', 'mirror-heavy'];
    
    for (const positioning of positionings) {
      for (const module of modules) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for UI update
        const prevPositioning = selectedPositioning;
        const prevModule = selectedModule;
        setSelectedPositioning(positioning);
        setSelectedModule(module);
        runPatternOptimization();
        setSelectedPositioning(prevPositioning);
        setSelectedModule(prevModule);
      }
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          {/* Positioning Dropdown */}
          <div>
            <label className="block text-gray-300 text-sm mb-1">Positioning</label>
            <select
              value={selectedPositioning}
              onChange={(e) => setSelectedPositioning(e.target.value)}
              disabled={isGenerating}
              className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
            >
              <option value="row-major">Row Major</option>
              <option value="column-major">Column Major</option>
              <option value="spiral-clockwise">Spiral Clockwise</option>
              <option value="spiral-counter">Spiral Counter</option>
              <option value="diagonal">Diagonal Sweeps</option>
              <option value="block-2x2">2x2 Blocks</option>
              <option value="checkerboard">Checkerboard</option>
              <option value="random-walk">Random Walk</option>
            </select>
          </div>

          {/* Module Dropdown */}
          <div>
            <label className="block text-gray-300 text-sm mb-1">Module</label>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              disabled={isGenerating}
              className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
            >
              <option value="edge-focused">Edge Focused</option>
              <option value="mirror-heavy">Mirror Heavy</option>
              <option value="shape-clustered">Shape Clustered</option>
            </select>
          </div>

          {/* With/Without Tiles Toggle */}
          <div>
            <label className="block text-gray-300 text-sm mb-1">Display</label>
            <select
              value={showTiles ? 'with-tiles' : 'without-tiles'}
              onChange={(e) => setShowTiles(e.target.value === 'with-tiles')}
              disabled={isGenerating}
              className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
            >
              <option value="with-tiles">With Tiles</option>
              <option value="without-tiles">Without Tiles</option>
            </select>
          </div>

          {/* Animation Speed Control */}
          <div>
            <label className="block text-gray-300 text-sm mb-1">Animation Speed</label>
            <select
              value={animationSpeed}
              onChange={(e) => setAnimationSpeed(parseInt(e.target.value))}
              disabled={isGenerating}
              className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
            >
              <option value={100}>Very Fast (0.1s)</option>
              <option value={300}>Fast (0.3s)</option>
              <option value={500}>Normal (0.5s)</option>
              <option value={1000}>Slow (1s)</option>
              <option value={2000}>Very Slow (2s)</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={runPatternOptimization}
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
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-white">
              Current Pattern: {selectedPositioning.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} + {selectedModule.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h3>
            <button
              onClick={() => setIsAnimating(!isAnimating)}
              disabled={isGenerating}
              className={`px-3 py-1 text-white rounded text-sm font-semibold transition-all duration-200
                ${isAnimating 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'}`}
            >
              {isAnimating ? '⏸️ Pause' : '▶️ Animate'}
            </button>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg">
            <div className="grid grid-cols-12 gap-0">
              {currentGrid.map((cell, index) => (
                <div
                  key={`${cell.x}-${cell.y}`}
                  className={`aspect-square transition-all duration-200 ${
                    !showTiles ? 'border border-gray-600' : ''
                  } ${
                    isAnimating && index === animationStep ? 'ring-2 ring-yellow-400' : ''
                  }`}
                  style={{
                    backgroundColor: !showTiles ? (cell.tile ? '#4B5563' : '#1F2937') : 'transparent'
                  }}
                >
                  {showTiles && cell.tile && (
                    <TileRenderer
                      tile={cell.tile}
                      customColors={customColors}
                      size={20}
                      seamless={true}
                    />
                  )}
                  {!showTiles && cell.tile && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-xs text-white font-mono">
                        {cell.tile.id}
                      </div>
                    </div>
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
                <div className="grid grid-cols-12 gap-0 mb-2">
                  {preview.grid.map((cell, cellIdx) => (
                    <div
                      key={`${idx}-${cellIdx}`}
                      className="aspect-square"
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