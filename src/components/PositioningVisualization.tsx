'use client';

import React, { useState, useEffect } from 'react';
import { TileData } from './CSVTable';
import TileRenderer from './TileRenderer';

interface PositioningVisualizationProps {
  allTiles: TileData[];
  customColors: { a: string; b: string; c: string; d: string };
}

type TraversalPattern = 'row-major' | 'column-major' | 'spiral-clockwise' | 'spiral-counter' | 'diagonal' | 'block-2x2' | 'checkerboard' | 'random-walk';

type TilePriorityRule = 'horizontal-mirrors' | 'vertical-mirrors' | 'rotation-90' | 'rotation-180' | 'rotation-270' | 'shape-group' | 'rotation-group';

const PATTERN_COLORS = {
  current: '#FF6B6B',     // Red for current position
  visited: '#4ECDC4',     // Teal for visited positions
  next: '#FFA07A',        // Orange for next positions
  unvisited: '#374151'    // Gray for unvisited
};

export default function PositioningVisualization({ 
  allTiles, 
  customColors 
}: PositioningVisualizationProps) {
  const [selectedPattern, setSelectedPattern] = useState<TraversalPattern>('spiral-clockwise');
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [traversalSequence, setTraversalSequence] = useState<number[]>([]);
  const [animationSpeed, setAnimationSpeed] = useState(500); // milliseconds
  
  // Tile rendering grid state
  const [renderingGrid, setRenderingGrid] = useState<(TileData | null)[]>([]);
  const [usedTiles, setUsedTiles] = useState<Set<string>>(new Set());
  const [uniqueTilesOnly, setUniqueTilesOnly] = useState(true);
  const [priorityRules, setPriorityRules] = useState<TilePriorityRule[]>(['vertical-mirrors']);
  const [shapeGroupTarget, setShapeGroupTarget] = useState<string>('same-as-previous');
  const [rotationGroupTarget, setRotationGroupTarget] = useState<string>('same-as-previous');
  
  const gridWidth = 24; // Double the size (was 12)
  const gridHeight = 16; // Double the size (was 8)
  const totalCells = gridWidth * gridHeight;

  // Generate traversal sequence based on pattern
  const generateTraversalSequence = (pattern: TraversalPattern): number[] => {
    const sequence: number[] = [];
    
    switch (pattern) {
      case 'row-major':
        for (let row = 0; row < gridHeight; row++) {
          for (let col = 0; col < gridWidth; col++) {
            sequence.push(row * gridWidth + col);
          }
        }
        break;
        
      case 'column-major':
        for (let col = 0; col < gridWidth; col++) {
          for (let row = 0; row < gridHeight; row++) {
            sequence.push(row * gridWidth + col);
          }
        }
        break;
        
      case 'spiral-clockwise':
        let top = 0, bottom = gridHeight - 1, left = 0, right = gridWidth - 1;
        
        while (top <= bottom && left <= right) {
          // Top row (left to right)
          for (let col = left; col <= right; col++) {
            sequence.push(top * gridWidth + col);
          }
          top++;
          
          // Right column (top to bottom)  
          for (let row = top; row <= bottom; row++) {
            sequence.push(row * gridWidth + right);
          }
          right--;
          
          // Bottom row (right to left)
          if (top <= bottom) {
            for (let col = right; col >= left; col--) {
              sequence.push(bottom * gridWidth + col);
            }
            bottom--;
          }
          
          // Left column (bottom to top)
          if (left <= right) {
            for (let row = bottom; row >= top; row--) {
              sequence.push(row * gridWidth + left);
            }
            left++;
          }
        }
        break;
        
      case 'diagonal':
        for (let d = 0; d < gridHeight + gridWidth - 1; d++) {
          for (let row = 0; row < gridHeight; row++) {
            const col = d - row;
            if (col >= 0 && col < gridWidth) {
              sequence.push(row * gridWidth + col);
            }
          }
        }
        break;
        
      case 'block-2x2':
        for (let blockRow = 0; blockRow < gridHeight; blockRow += 2) {
          for (let blockCol = 0; blockCol < gridWidth; blockCol += 2) {
            for (let r = blockRow; r < Math.min(blockRow + 2, gridHeight); r++) {
              for (let c = blockCol; c < Math.min(blockCol + 2, gridWidth); c++) {
                sequence.push(r * gridWidth + c);
              }
            }
          }
        }
        break;
        
      case 'checkerboard':
        // First pass: even positions
        for (let row = 0; row < gridHeight; row++) {
          for (let col = 0; col < gridWidth; col++) {
            if ((row + col) % 2 === 0) {
              sequence.push(row * gridWidth + col);
            }
          }
        }
        // Second pass: odd positions
        for (let row = 0; row < gridHeight; row++) {
          for (let col = 0; col < gridWidth; col++) {
            if ((row + col) % 2 === 1) {
              sequence.push(row * gridWidth + col);
            }
          }
        }
        break;
        
      case 'random-walk':
        const positions = Array.from({ length: totalCells }, (_, i) => i);
        for (let i = positions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [positions[i], positions[j]] = [positions[j], positions[i]];
        }
        sequence.push(...positions);
        break;
        
      default:
        for (let i = 0; i < totalCells; i++) {
          sequence.push(i);
        }
    }
    
    return sequence;
  };

  // Find best tile based on priority rules
  const findBestTile = (position: number, previousTile?: TileData | null): TileData | null => {
    let availableTiles = [...allTiles];
    
    // Filter out used tiles if uniqueTilesOnly is enabled
    if (uniqueTilesOnly) {
      availableTiles = availableTiles.filter(tile => !usedTiles.has(tile.id));
    }
    
    if (availableTiles.length === 0) {
      return null; // No tiles available
    }
    
    // Score tiles based on priority rules
    const scoredTiles = availableTiles.map(tile => ({
      tile,
      score: calculateTileScore(tile, position, previousTile)
    }));
    
    // Sort by score (highest first) and return the best tile
    scoredTiles.sort((a, b) => b.score - a.score);
    return scoredTiles[0].tile;
  };

  // Calculate tile score based on priority rules
  const calculateTileScore = (tile: TileData, position: number, previousTile?: TileData | null): number => {
    let score = 0;
    
    if (!previousTile) {
      return Math.random(); // Random score for first tile
    }
    
    priorityRules.forEach((rule, index) => {
      const ruleWeight = priorityRules.length - index; // Higher weight for earlier rules
      
      switch (rule) {
        case 'horizontal-mirrors':
          if (tile.mirrorH === previousTile.id || previousTile.mirrorH === tile.id) {
            score += ruleWeight * 10;
          }
          break;
          
        case 'vertical-mirrors':
          if (tile.mirrorV === previousTile.id || previousTile.mirrorV === tile.id) {
            score += ruleWeight * 10;
          }
          break;
          
        case 'rotation-90':
          if (tile.rotation90 === previousTile.id || previousTile.rotation90 === tile.id) {
            score += ruleWeight * 8;
          }
          break;
          
        case 'rotation-180':
          if (tile.rotation180 === previousTile.id || previousTile.rotation180 === tile.id) {
            score += ruleWeight * 8;
          }
          break;
          
        case 'rotation-270':
          if (tile.rotation270 === previousTile.id || previousTile.rotation270 === tile.id) {
            score += ruleWeight * 8;
          }
          break;
          
        case 'shape-group':
          if (shapeGroupTarget === 'same-as-previous' && tile.shape === previousTile.shape) {
            score += ruleWeight * 6;
          } else if (shapeGroupTarget !== 'same-as-previous' && tile.shape === shapeGroupTarget) {
            score += ruleWeight * 6;
          }
          break;
          
        case 'rotation-group':
          // This would need rotation group data from CSV
          if (rotationGroupTarget === 'same-as-previous') {
            score += ruleWeight * 4;
          }
          break;
      }
    });
    
    // Add small random component to break ties
    score += Math.random() * 0.1;
    
    return score;
  };

  // Get tile family name (like patterns4.csv format)
  const getTileFamilyName = (tile: TileData): string => {
    // Map shape numbers to rotation names
    const rotationNames: { [key: string]: string } = {
      '1': 'Base',
      '2': 'Rotation 90', 
      '3': 'Rotation 180',
      '4': 'Rotation 270'
    };
    
    const shapeName = rotationNames[tile.shape] || `Shape ${tile.shape}`;
    return `${shapeName} - Group ${tile.shape}`;
  };

  // Update traversal sequence when pattern changes
  useEffect(() => {
    const sequence = generateTraversalSequence(selectedPattern);
    setTraversalSequence(sequence);
    setCurrentStep(0);
    setRenderingGrid(new Array(totalCells).fill(null));
    setUsedTiles(new Set());
  }, [selectedPattern, totalCells]);

  // Animation effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isAnimating && currentStep < traversalSequence.length) {
      intervalId = setInterval(() => {
        setCurrentStep(prev => {
          const next = prev + 1;
          if (next >= traversalSequence.length) {
            setIsAnimating(false);
            return prev;
          }
          
          // Add tile to rendering grid
          const position = traversalSequence[prev];
          const previousPosition = prev > 0 ? traversalSequence[prev - 1] : null;
          const previousTile = previousPosition !== null ? renderingGrid[previousPosition] : null;
          
          const bestTile = findBestTile(position, previousTile);
          
          if (bestTile) {
            setRenderingGrid(prevGrid => {
              const newGrid = [...prevGrid];
              newGrid[position] = bestTile;
              return newGrid;
            });
            
            if (uniqueTilesOnly) {
              setUsedTiles(prev => new Set([...prev, bestTile.id]));
            }
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
  }, [isAnimating, animationSpeed, currentStep, traversalSequence, renderingGrid, usedTiles, uniqueTilesOnly, priorityRules]);

  const resetAnimation = () => {
    setCurrentStep(0);
    setIsAnimating(false);
    setRenderingGrid(new Array(totalCells).fill(null));
    setUsedTiles(new Set());
  };

  const getCellState = (position: number) => {
    const stepIndex = traversalSequence.indexOf(position);
    
    if (stepIndex === currentStep && isAnimating) {
      return 'current';
    } else if (stepIndex < currentStep) {
      return 'visited';
    } else if (stepIndex === currentStep + 1 || stepIndex === currentStep + 2) {
      return 'next';
    } else {
      return 'unvisited';
    }
  };

  const getCellColor = (position: number) => {
    const state = getCellState(position);
    return PATTERN_COLORS[state];
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-4">Positioning Visualization</h2>
        <p className="text-gray-300 text-sm mb-4">
          Watch how different positioning methods render tiles with intelligent selection
        </p>
      </div>

      {/* Three Grids Side by Side */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Traversal Pattern Grid */}
        <div>
          <div className="bg-gray-900 p-3 rounded-lg">
            <div 
              className="grid gap-0"
              style={{ 
                gridTemplateColumns: `repeat(${Math.min(gridWidth, 24)}, 1fr)`,
                fontSize: '8px' // Smaller for double-size grid
              }}
            >
              {Array.from({ length: totalCells }, (_, position) => (
                <div
                  key={position}
                  className="aspect-square border border-gray-700 flex items-center justify-center text-xs font-mono font-bold transition-all duration-200"
                  style={{ 
                    backgroundColor: getCellColor(position),
                    color: getCellState(position) === 'unvisited' ? '#9CA3AF' : '#000',
                    fontSize: '6px'
                  }}
                >
                  {position < currentStep ? position + 1 : ''}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Static Pattern Grid */}
        <div>
          <div className="bg-gray-900 p-3 rounded-lg">
            <div 
              className="grid gap-0"
              style={{ gridTemplateColumns: `repeat(${Math.min(gridWidth, 24)}, 1fr)` }}
            >
              {Array.from({ length: totalCells }, (_, position) => {
                const row = Math.floor(position / gridWidth);
                const col = position % gridWidth;
                
                // Create pattern based on selected pattern type
                let patternValue = '';
                switch (selectedPattern) {
                  case 'block-2x2':
                    const blockRow = Math.floor(row / 2);
                    const blockCol = Math.floor(col / 2);
                    patternValue = `B${blockRow * Math.ceil(gridWidth / 2) + blockCol + 1}`;
                    break;
                  case 'checkerboard':
                    patternValue = (row + col) % 2 === 0 ? 'Even' : 'Odd';
                    break;
                  default:
                    patternValue = selectedPattern.charAt(0).toUpperCase();
                }
                
                return (
                  <div
                    key={position}
                    className="aspect-square border border-gray-700 flex items-center justify-center text-xs font-mono transition-all duration-200"
                    style={{ 
                      backgroundColor: '#4B5563',
                      color: '#FFF',
                      fontSize: '6px'
                    }}
                  >
                    {patternValue}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tile Rendering Grid */}
        <div>
          <div className="bg-gray-900 p-3 rounded-lg">
            <div 
              className="grid gap-0"
              style={{ gridTemplateColumns: `repeat(${Math.min(gridWidth, 24)}, 1fr)` }}
            >
              {renderingGrid.map((tile, position) => (
                <div
                  key={position}
                  className={`aspect-square transition-all duration-200 ${
                    position < currentStep && tile ? 'opacity-100' : 'opacity-50'
                  } ${
                    traversalSequence[currentStep] === position && isAnimating ? 'ring-2 ring-yellow-400' : ''
                  }`}
                  style={{ fontSize: '4px' }}
                >
                  {tile && (
                    <TileRenderer
                      tile={tile}
                      customColors={customColors}
                      size={8}
                      seamless={true}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Controls at Bottom */}
      <div className="bg-gray-700 rounded-lg p-4">
        {/* Pattern Selection */}
        <div className="flex items-center gap-4 mb-4">
          <select
            value={selectedPattern}
            onChange={(e) => setSelectedPattern(e.target.value as TraversalPattern)}
            disabled={isAnimating}
            className="px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
          >
            <option value="spiral-clockwise">Spiral Clockwise</option>
            <option value="row-major">Row Major</option>
            <option value="column-major">Column Major</option>
            <option value="spiral-counter">Spiral Counter-Clockwise</option>
            <option value="diagonal">Diagonal Sweeps</option>
            <option value="block-2x2">2x2 Blocks</option>
            <option value="checkerboard">Checkerboard</option>
            <option value="random-walk">Random Walk</option>
          </select>

          <button
            onClick={() => setIsAnimating(!isAnimating)}
            disabled={currentStep >= traversalSequence.length}
            className={`px-4 py-2 text-white rounded-lg font-semibold transition-all duration-200
              ${isAnimating 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'} 
              ${currentStep >= traversalSequence.length ? 'bg-gray-600 cursor-not-allowed' : ''}`}
          >
            {isAnimating ? '⏹️ Stop Animation' : '▶️ Start Animation'}
          </button>

          <button
            onClick={resetAnimation}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold
                     hover:bg-blue-700 transition-all duration-200"
          >
            🔄 Reset
          </button>

          <div className="text-sm text-gray-300">
            Step: {currentStep} / {traversalSequence.length}
          </div>
        </div>

        {/* Priority Rules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Tile Selection Priority</label>
            <select
              value={priorityRules[0] || 'vertical-mirrors'}
              onChange={(e) => setPriorityRules([e.target.value as TilePriorityRule])}
              className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500"
            >
              <option value="vertical-mirrors">Vertical Mirrors</option>
              <option value="horizontal-mirrors">Horizontal Mirrors</option>
              <option value="rotation-90">90° Rotation</option>
              <option value="rotation-180">180° Rotation</option>
              <option value="rotation-270">270° Rotation</option>
              <option value="shape-group">Shape Group</option>
              <option value="rotation-group">Rotation Group</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">Animation Speed</label>
            <select
              value={animationSpeed}
              onChange={(e) => setAnimationSpeed(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500"
            >
              <option value={100}>Very Fast (0.1s)</option>
              <option value={300}>Fast (0.3s)</option>
              <option value={500}>Normal (0.5s)</option>
              <option value={1000}>Slow (1s)</option>
              <option value={2000}>Very Slow (2s)</option>
            </select>
          </div>

          <div className="flex items-center">
            <label className="flex items-center text-gray-300 text-sm">
              <input
                type="checkbox"
                checked={uniqueTilesOnly}
                onChange={(e) => setUniqueTilesOnly(e.target.checked)}
                className="mr-2"
              />
              Unique Tiles Only
            </label>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: PATTERN_COLORS.current }}></div>
            <span className="text-gray-300">Current</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: PATTERN_COLORS.visited }}></div>
            <span className="text-gray-300">Visited</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: PATTERN_COLORS.next }}></div>
            <span className="text-gray-300">Next</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: PATTERN_COLORS.unvisited }}></div>
            <span className="text-gray-300">Unvisited</span>
          </div>
        </div>
      </div>

      {/* Current Tile Info */}
      {currentStep > 0 && traversalSequence[currentStep - 1] !== undefined && renderingGrid[traversalSequence[currentStep - 1]] && (
        <div className="mt-4 p-3 bg-gray-700 rounded-lg">
          <h4 className="text-white font-semibold mb-2">Current Tile:</h4>
          <p className="text-gray-300 text-sm">
            {getTileFamilyName(renderingGrid[traversalSequence[currentStep - 1]]!)} - 
            Position {currentStep} - 
            ID: {renderingGrid[traversalSequence[currentStep - 1]]!.id}
          </p>
        </div>
      )}
    </div>
  );
}