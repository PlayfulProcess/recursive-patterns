'use client';

import React, { useState, useEffect } from 'react';
import { TileData } from './CSVTable';
import TileRenderer from './TileRenderer';
import { generateTraversalSequence, TraversalPattern } from '@/lib/traversalPatterns';

interface PositioningVisualizationProps {
  allTiles: TileData[];
  customColors: { a: string; b: string; c: string; d: string };
  onRenderToMainGrid?: (tiles: (TileData | null)[]) => void;
}


type TilePriorityRule = 'horizontal-mirrors' | 'vertical-mirrors' | 'rotation-90' | 'rotation-180' | 'rotation-270' | 'shape-group' | 'rotation-group';

const PATTERN_COLORS = {
  current: '#FF6B6B',     // Red for current position
  visited: '#4ECDC4',     // Teal for visited positions
  next: '#FFA07A',        // Orange for next positions
  unvisited: '#374151'    // Gray for unvisited
};

export default function PositioningVisualization({ 
  allTiles, 
  customColors,
  onRenderToMainGrid 
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
  const [rotationSequence, setRotationSequence] = useState<string>('0,1,2,3');
  
  // Pattern replication state
  const [patternTemplate, setPatternTemplate] = useState<TileData[]>([]);
  const [isReplicationMode, setIsReplicationMode] = useState(false);
  const [duplicateCount, setDuplicateCount] = useState(0);
  
  const gridWidth = 12; // Correct grid size for 96 tiles
  const gridHeight = 8;  // Correct grid size for 96 tiles
  const totalCells = gridWidth * gridHeight;

  // Detect duplicate tiles in the rendering grid
  const detectDuplicates = () => {
    const tileCount = new Map<string, number>();
    
    renderingGrid.forEach(tile => {
      if (tile) {
        const count = (tileCount.get(tile.id) || 0) + 1;
        tileCount.set(tile.id, count);
      }
    });
    
    // Count tiles that appear more than once
    let duplicateCount = 0;
    tileCount.forEach((count, tileId) => {
      if (count > 1) {
        duplicateCount += count - 1; // Count all duplicate instances
      }
    });
    
    setDuplicateCount(duplicateCount);
  };

  // Find unused tile with specific rotation, prioritizing new shapes
  const findBestShape = (targetRotation: number, usedShapes: Set<number>): TileData | null => {
    const availableTiles = allTiles.filter(tile => 
      !usedTiles.has(tile.id) && 
      tile.rotation === targetRotation
    );
    
    // First try: find tile with rotation that has a new shape (not used in current cycle)
    const newShapeTiles = availableTiles.filter(tile => !usedShapes.has(tile.shape));
    if (newShapeTiles.length > 0) {
      console.log(`✅ Found NEW shape tile for rotation ${targetRotation}: ${newShapeTiles[0].id} (shape ${newShapeTiles[0].shape})`);
      return newShapeTiles[0];
    }
    
    // Fallback: any available tile with target rotation
    if (availableTiles.length > 0) {
      console.log(`⚠️ Using ANY shape tile for rotation ${targetRotation}: ${availableTiles[0].id} (shape ${availableTiles[0].shape})`);
      return availableTiles[0];
    }
    
    console.log(`❌ No tiles available for rotation ${targetRotation}`);
    return null;
  };

  // Find best tile based on priority rules
  const findBestTile = (position: number, previousTile?: TileData | null): TileData | null => {
    // Debug logging
    console.log(`🔍 Debug: pattern=${selectedPattern}, rules=${priorityRules}, unique=${uniqueTilesOnly}`);
    
    // Rotation group logic for ALL patterns (not just 2x2)
    if (priorityRules.includes('rotation-group') && uniqueTilesOnly) {
      console.log(`🎯 Using rotation-group logic for position ${position}`);
      const stepNumber = traversalSequence.indexOf(position);
      if (stepNumber === -1) return null;
      
      // Every 4 steps = one rotation cycle, use same rotation sequence
      const positionInCycle = stepNumber % 4;
      const rotations = rotationSequence.split(',').map(n => parseInt(n.trim()));
      const targetRotation = rotations[positionInCycle];
      
      // Track shapes used in current 4-tile cycle
      const cycleStart = Math.floor(stepNumber / 4) * 4;
      const usedShapesInCycle = new Set<number>();
      
      // Check what shapes we've already used in this cycle
      for (let i = cycleStart; i < stepNumber; i++) {
        const pos = traversalSequence[i];
        const existingTile = renderingGrid[pos];
        if (existingTile) {
          usedShapesInCycle.add(existingTile.shape);
        }
      }
      
      console.log(`🔄 Step ${stepNumber}, Cycle position ${positionInCycle}, Target rotation ${targetRotation}, Used shapes in cycle: ${Array.from(usedShapesInCycle)}`);
      return findBestShape(targetRotation, usedShapesInCycle);
    }
    let availableTiles = [...allTiles];
    
    // Filter out used tiles if uniqueTilesOnly is enabled
    if (uniqueTilesOnly) {
      availableTiles = availableTiles.filter(tile => !usedTiles.has(tile.id));
    }
    
    if (availableTiles.length === 0) {
      console.log(`🚨 No available tiles for position ${position}. Used tiles: ${usedTiles.size}/${allTiles.length}`);
      return null; // No tiles available
    }
    
    if (!previousTile) {
      // Return random tile for first position
      return availableTiles[Math.floor(Math.random() * availableTiles.length)];
    }
    
    // SELECTIVE INTELLIGENT FILTERING: Only apply when user specifically selects shape/rotation groups
    let tilesToScore = availableTiles;
    const hasShapeGroupRule = priorityRules.includes('shape-group');
    const hasRotationGroupRule = priorityRules.includes('rotation-group');
    
    if (hasShapeGroupRule || hasRotationGroupRule) {
      let priorityTiles: TileData[] = [];
      
      if (hasShapeGroupRule) {
        // Same shape group tiles
        const sameShapeTiles = availableTiles.filter(tile => 
          tile.shape === previousTile.shape
        );
        priorityTiles.push(...sameShapeTiles);
      }
      
      if (hasRotationGroupRule) {
        // Same rotation family tiles
        const sameRotationFamilyTiles = availableTiles.filter(tile => {
          const prevRotations = [
            (previousTile as any).rotation0,
            (previousTile as any).rotation90,
            (previousTile as any).rotation180, 
            (previousTile as any).rotation270
          ].filter(Boolean);
          return prevRotations.includes(tile.id);
        });
        priorityTiles.push(...sameRotationFamilyTiles);
      }
      
      // Remove duplicates
      priorityTiles = priorityTiles.filter((tile, index, self) => 
        index === self.findIndex(t => t.id === tile.id)
      );
      
      // Use priority tiles if available, otherwise all available
      if (priorityTiles.length > 0) {
        tilesToScore = priorityTiles;
        console.log(`🎯 Shape/Rotation group filtering found ${priorityTiles.length} priority tiles`);
      }
    }
    
    // Score tiles based on priority rules
    const scoredTiles = tilesToScore.map(tile => ({
      tile,
      score: calculateTileScore(tile, position, previousTile)
    }));
    
    // Sort by score (highest first)
    scoredTiles.sort((a, b) => b.score - a.score);
    
    // Debug logging
    console.log(`Position ${position}, Priority: ${priorityRules[0]}, Previous: ${previousTile.id}`);
    console.log(`Top matches:`, scoredTiles.slice(0, 3).map(st => ({
      id: st.tile.id,
      score: st.score,
      mirrorV: st.tile.mirrorV,
      mirrorH: st.tile.mirrorH,
      rotation90: st.tile.rotation90,
      rotation180: st.tile.rotation180,
      rotation270: st.tile.rotation270
    })));
    
    return scoredTiles[0].tile;
  };

  /**
   * TILE SELECTION ALGORITHM DOCUMENTATION
   * =====================================
   * 
   * INTELLIGENT TILE SELECTION STRATEGY:
   * This system prioritizes completing shape groups (1-24) and rotation families (4 variants each)
   * instead of random selection. It uses patterns4.csv data structure:
   * 
   * CSV Structure:
   * - id: tile identifier (e.g., "bcaa", "cbaa")
   * - edgeN/E/S/W: edge patterns (letters a,b,c,d)
   * - shape: numeric shape group (1-24) - tiles with same shape form related families
   * - mirrorH/V: horizontal/vertical mirror tile IDs for mirror relationships
   * - rotation0/90/180/270: rotation variant tile IDs (complete 4-tile families)
   * - rotation: group number for rotation families (0-3)
   * 
   * SELECTION PROCESS:
   * 1. First Tile: Find tiles with complete rotation families (≥3 variants) or largest shape groups
   * 2. Subsequent Tiles: Prioritize same shape group OR same rotation family tiles
   * 3. Scoring: Apply user-selected priority rules with enhanced bidirectional matching
   * 4. Fallback: Only use random selection when no intelligent matches exist
   * 
   * Priority Rules (applied with decreasing weight):
   * 1. horizontal-mirrors/vertical-mirrors: Bidirectional mirror relationships
   * 2. rotation-90/180/270: Enhanced rotation matching with reverse checks
   * 3. shape-group: Same shape value matching
   * 4. rotation-group: Progressive bonus for completing rotation families
   * 
   * Scoring System:
   * - Mirror matches: 100 points × rule weight
   * - Rotation matches: 70-80 points × rule weight (with reverse bonuses)
   * - Shape matches: 60 points × rule weight
   * - Rotation family completion: 30-90 points (progressive bonus)
   * - Random tie-breaker: 0.1 points
   */
  const calculateTileScore = (tile: TileData, position: number, previousTile?: TileData | null): number => {
    let score = 0;
    
    if (!previousTile) {
      return Math.random(); // Random score for first tile
    }
    
    priorityRules.forEach((rule, index) => {
      const ruleWeight = priorityRules.length - index; // Higher weight for earlier rules
      
      switch (rule) {
        case 'horizontal-mirrors':
          // Check if this tile is the horizontal mirror of previous tile
          if ((tile as any).mirrorH === previousTile.id || (previousTile as any).mirrorH === tile.id) {
            score += ruleWeight * 100;
          }
          break;
          
        case 'vertical-mirrors':
          // Check if this tile is the vertical mirror of previous tile
          if ((tile as any).mirrorV === previousTile.id || (previousTile as any).mirrorV === tile.id) {
            score += ruleWeight * 100;
          }
          break;
          
        case 'rotation-90':
          // Enhanced 90° rotation matching - check both directions
          if ((tile as any).rotation90 === previousTile.id || (previousTile as any).rotation90 === tile.id) {
            score += ruleWeight * 80;
            console.log(`🔄 90° rotation match: ${tile.id} ↔ ${previousTile.id}`);
          }
          // Also check if this tile's 270° rotation is the previous tile (reverse relationship)
          if ((tile as any).rotation270 === previousTile.id || (previousTile as any).rotation270 === tile.id) {
            score += ruleWeight * 70;
            console.log(`🔄 270° reverse rotation match: ${tile.id} ↔ ${previousTile.id}`);
          }
          break;
          
        case 'rotation-180':
          // Enhanced 180° rotation matching - bidirectional
          if ((tile as any).rotation180 === previousTile.id || (previousTile as any).rotation180 === tile.id) {
            score += ruleWeight * 80;
            console.log(`🔄 180° rotation match: ${tile.id} ↔ ${previousTile.id}`);
          }
          break;
          
        case 'rotation-270':
          // Enhanced 270° rotation matching - check both directions
          if ((tile as any).rotation270 === previousTile.id || (previousTile as any).rotation270 === tile.id) {
            score += ruleWeight * 80;
            console.log(`🔄 270° rotation match: ${tile.id} ↔ ${previousTile.id}`);
          }
          // Also check if this tile's 90° rotation is the previous tile (reverse relationship)
          if ((tile as any).rotation90 === previousTile.id || (previousTile as any).rotation90 === tile.id) {
            score += ruleWeight * 70;
            console.log(`🔄 90° reverse rotation match: ${tile.id} ↔ ${previousTile.id}`);
          }
          break;
          
        case 'shape-group':
          if (shapeGroupTarget === 'same-as-previous' && tile.shape === previousTile.shape) {
            score += ruleWeight * 60;
          } else if (shapeGroupTarget !== 'same-as-previous' && tile.shape === shapeGroupTarget) {
            score += ruleWeight * 60;
          }
          break;
          
        case 'rotation-group':
          // Enhanced rotation group matching - prioritize completing rotation families
          if (rotationGroupTarget === 'same-as-previous' && (tile as any).rotation === (previousTile as any).rotation) {
            score += ruleWeight * 40;
          }
          
          // Additional bonus: prioritize tiles that are rotations of tiles already placed
          const placedTileIds = new Set(renderingGrid.filter(t => t !== null).map(t => t!.id));
          const tileRotations = [
            (tile as any).rotation0,
            (tile as any).rotation90,
            (tile as any).rotation180,
            (tile as any).rotation270
          ].filter(Boolean);
          
          // Count how many rotations of this tile family are already placed
          const rotationsAlreadyPlaced = tileRotations.filter(rotId => placedTileIds.has(rotId)).length;
          
          // Give bonus for completing rotation families (more rotations placed = higher score)
          if (rotationsAlreadyPlaced > 0) {
            score += ruleWeight * 30 * rotationsAlreadyPlaced;
            console.log(`🔄 Rotation family bonus: ${tile.id} has ${rotationsAlreadyPlaced} rotations already placed, bonus: ${ruleWeight * 30 * rotationsAlreadyPlaced}`);
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
    // From CSV analysis: rotation column values 0,1,2 correspond to rotations
    const rotationValue = (tile as any).rotation || '0';
    const rotationNames: { [key: string]: string } = {
      '0': 'Base',
      '1': 'Rotation 90', 
      '2': 'Rotation 180',
      '3': 'Rotation 270'
    };
    
    const rotationName = rotationNames[rotationValue] || `Rotation ${rotationValue}`;
    const shapeGroup = tile.shape || '1';
    return `${rotationName} - Shape Group ${shapeGroup}`;
  };

  // Update traversal sequence when pattern changes
  useEffect(() => {
    const sequence = generateTraversalSequence(selectedPattern, gridWidth, gridHeight);
    setTraversalSequence(sequence);
    setCurrentStep(0);
    setRenderingGrid(new Array(totalCells).fill(null));
    setUsedTiles(new Set());
    setPatternTemplate([]);
  }, [selectedPattern, totalCells]);

  // Animation effect - Fixed to prevent multiple intervals and sync issues
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isAnimating && currentStep < traversalSequence.length) {
      intervalId = setInterval(() => {
        setCurrentStep(prev => {
          const next = prev + 1;
          return next;
        });
      }, animationSpeed);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAnimating, animationSpeed, traversalSequence.length]);

  // Separate effect to stop animation when complete
  useEffect(() => {
    if (isAnimating && currentStep >= traversalSequence.length) {
      setIsAnimating(false);
    }
  }, [currentStep, traversalSequence.length, isAnimating]);

  // Separate effect to update rendering grid based on current step
  useEffect(() => {
    if (currentStep > 0 && currentStep <= traversalSequence.length) {
      const position = traversalSequence[currentStep - 1];
      
      // Use functional update to avoid dependency on renderingGrid
      setRenderingGrid(prevGrid => {
        // Only add tile if this position doesn't already have one
        if (!prevGrid[position]) {
          const previousPosition = currentStep > 1 ? traversalSequence[currentStep - 2] : null;
          const previousTile = previousPosition !== null ? prevGrid[previousPosition] : null;
          
          const bestTile = findBestTile(position, previousTile);
          
          if (bestTile) {
            const newGrid = [...prevGrid];
            newGrid[position] = bestTile;
            
            if (uniqueTilesOnly) {
              setUsedTiles(prev => {
                const newUsedTiles = new Set([...prev, bestTile.id]);
                console.log(`🎯 Position ${currentStep}: Placed tile ${bestTile.id}. Used: ${newUsedTiles.size}/96`);
                return newUsedTiles;
              });
            }
            
            // Build pattern template from first block for replication
            const needsReplication = selectedPattern === 'block-2x2' && 
              (priorityRules.includes('shape-group') || priorityRules.includes('rotation-group'));
            if (needsReplication && currentStep <= 4) {
              setPatternTemplate(prev => {
                const newTemplate = [...prev, bestTile];
                if (newTemplate.length === 4) {
                  console.log(`📋 Pattern template built:`, newTemplate.map(t => t.id));
                }
                return newTemplate;
              });
            }
            
            return newGrid;
          } else {
            console.log(`❌ Position ${currentStep}: No bestTile found for position ${position}`);
          }
        }
        return prevGrid;
      });
    }
  }, [currentStep, traversalSequence, uniqueTilesOnly]);

  // Update duplicate count when rendering grid changes
  useEffect(() => {
    detectDuplicates();
  }, [renderingGrid]);

  const resetAnimation = () => {
    setCurrentStep(0);
    setIsAnimating(false);
    setRenderingGrid(new Array(totalCells).fill(null));
    setUsedTiles(new Set());
    setPatternTemplate([]);
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

      {/* Controls at Top */}
      <div className="bg-gray-700 rounded-lg p-4 mb-6">
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

          {onRenderToMainGrid && (
            <button
              onClick={() => onRenderToMainGrid(renderingGrid)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 
                       transition-colors font-semibold"
            >
              📤 Render to Main Grid
            </button>
          )}

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

          {/* Rotation Sequence Input - only show when Rotation Group is selected */}
          {priorityRules.includes('rotation-group') && (
            <div>
              <label className="block text-gray-300 text-sm mb-2">
                Rotation Sequence (comma-separated)
              </label>
              <input
                type="text"
                value={rotationSequence}
                onChange={(e) => setRotationSequence(e.target.value)}
                placeholder="0,1,2,3"
                className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
              />
              <div className="text-xs text-gray-400 mt-1">
                Examples: 0,1,2,3 | 0,2,1,3 | 3,2,1,0 | 1,0,3,2
              </div>
            </div>
          )}

          <div>
            <label className="block text-gray-300 text-sm mb-2">Animation Speed</label>
            <select
              value={animationSpeed}
              onChange={(e) => setAnimationSpeed(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500"
            >
              <option value={1}>Instant</option>
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

      {/* Three Grids - Side by Side */}
      <div className="grid grid-cols-3 gap-4">
        {/* Traversal Pattern Grid */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Traversal Animation (Colored)</h3>
          <div className="bg-gray-900 p-2 rounded-lg">
            <div 
              className="grid gap-0"
              style={{ 
                gridTemplateColumns: `repeat(${gridWidth}, 1fr)`
              }}
            >
              {Array.from({ length: totalCells }, (_, position) => (
                <div
                  key={position}
                  className="aspect-square border border-gray-700 flex items-center justify-center text-xs font-mono font-bold transition-all duration-200"
                  style={{ 
                    backgroundColor: getCellColor(position),
                    color: getCellState(position) === 'unvisited' ? '#9CA3AF' : '#000',
                    fontSize: '8px'
                  }}
                >
                  {traversalSequence.indexOf(position) + 1}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Static Pattern Grid - Shows immediately */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Static Pattern Structure</h3>
          <div className="bg-gray-900 p-2 rounded-lg">
            <div 
              className="grid gap-0"
              style={{ 
                gridTemplateColumns: `repeat(${gridWidth}, 1fr)`
              }}
            >
              {Array.from({ length: totalCells }, (_, position) => {
                const row = Math.floor(position / gridWidth);
                const col = position % gridWidth;
                
                // Create pattern based on selected pattern type - Shows immediately
                let patternValue = '';
                let patternColor = '#4B5563';
                
                switch (selectedPattern) {
                  case 'block-2x2':
                    const blockRow = Math.floor(row / 2);
                    const blockCol = Math.floor(col / 2);
                    const blockId = blockRow * Math.ceil(gridWidth / 2) + blockCol;
                    patternValue = `B${blockId + 1}`;
                    patternColor = `hsl(${(blockId * 30) % 360}, 50%, 40%)`;
                    break;
                  case 'checkerboard':
                    patternValue = (row + col) % 2 === 0 ? 'E' : 'O';
                    patternColor = (row + col) % 2 === 0 ? '#4B5563' : '#6B7280';
                    break;
                  case 'row-major':
                    patternValue = `R${row + 1}`;
                    patternColor = `hsl(${(row * 30) % 360}, 50%, 40%)`;
                    break;
                  case 'column-major':
                    patternValue = `C${col + 1}`;
                    patternColor = `hsl(${(col * 15) % 360}, 50%, 40%)`;
                    break;
                  default:
                    patternValue = selectedPattern.charAt(0).toUpperCase();
                    patternColor = '#4B5563';
                }
                
                return (
                  <div
                    key={position}
                    className="aspect-square border border-gray-700 flex items-center justify-center text-xs font-mono transition-all duration-200"
                    style={{ 
                      backgroundColor: patternColor,
                      color: '#FFF',
                      fontSize: '8px'
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
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-white">Intelligent Tile Rendering</h3>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-300">
                Tiles: {renderingGrid.filter(t => t !== null).length}/96
              </span>
              <span className={`${duplicateCount > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                Duplicates: {duplicateCount}
              </span>
            </div>
          </div>
          <div className="bg-gray-900 p-2 rounded-lg">
            <div 
              className="grid gap-0"
              style={{ 
                gridTemplateColumns: `repeat(${gridWidth}, 1fr)`
              }}
            >
              {renderingGrid.map((tile, position) => (
                <div
                  key={position}
                  className={`aspect-square transition-all duration-200 border border-gray-700 ${
                    traversalSequence.indexOf(position) < currentStep && tile ? 'opacity-100' : 'opacity-30'
                  } ${
                    traversalSequence[currentStep] === position && isAnimating ? 'ring-2 ring-yellow-400' : ''
                  }`}
                  style={{ 
                    backgroundColor: !tile ? '#1F2937' : 'transparent'
                  }}
                >
                  {tile && (
                    <TileRenderer
                      tile={tile}
                      customColors={customColors}
                      size={16}
                      seamless={true}
                    />
                  )}
                  {!tile && position < traversalSequence.length && (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                      {position + 1}
                    </div>
                  )}
                </div>
              ))}
            </div>
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