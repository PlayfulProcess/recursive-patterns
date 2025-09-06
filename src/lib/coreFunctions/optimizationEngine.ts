/**
 * Parameterized optimization engine with configurable scoring and traversal
 */

import { TileData } from '../../components/CSVTable';
import { GridCell, TileRelationships } from './types';
import { 
  OptimizationConfig, 
  OptimizationContext, 
  OptimizationResult, 
  OptimizationWeights,
  TraversalPattern,
  DEFAULT_WEIGHTS,
  OPTIMIZATION_PRESETS
} from './optimizationConfig';
import { 
  DEFAULT_SCORING_FUNCTIONS, 
  createColorSpecificMatching,
  SCORING_PRESETS 
} from './scoringFunctions';
import { buildTileRelationships } from './recursive';

/**
 * Calculate weighted score for a tile at a specific position
 */
function calculateTileScore(
  tile: TileData,
  context: OptimizationContext,
  weights: OptimizationWeights
): number {
  let totalScore = 0;

  // Apply each scoring function with its weight
  context.targetTile = tile;
  
  // Edge matching score with color priority weighting
  const edgeScore = context.targetTile ? getEdgeMatchingScore(tile, context) : 0;
  const colorWeightedEdgeScore = applyColorWeighting(tile, edgeScore, weights.colorPriority);
  totalScore += colorWeightedEdgeScore * weights.edgeMatching;

  // Mirror relationship score
  const mirrorScore = getMirrorScore(tile, context);
  totalScore += mirrorScore * weights.mirrorBonus;

  // Rotation family score
  const rotationScore = getRotationScore(tile, context);
  totalScore += rotationScore * weights.rotationBonus;

  // Shape clustering score
  const shapeScore = getShapeClusterScore(tile, context);
  totalScore += shapeScore * weights.shapeCluster;

  // Distance penalty
  const distanceScore = getDistancePenalty(tile, context);
  totalScore += distanceScore * weights.distancePenalty;

  return totalScore;
}

/**
 * Apply color priority weighting to edge matching score
 */
function applyColorWeighting(
  tile: TileData,
  baseScore: number,
  colorPriority: { a: number; b: number; c: number; d: number }
): number {
  const edges = [tile.edgeN, tile.edgeE, tile.edgeS || (tile as any).EdgeS || '', tile.edgeW];
  const maxPriority = Math.max(...Object.values(colorPriority));
  
  // Find the highest priority color in this tile's edges
  let highestPriorityWeight = 1;
  edges.forEach(edge => {
    const weight = (colorPriority as any)[edge] || 1;
    if (weight > highestPriorityWeight) {
      highestPriorityWeight = weight;
    }
  });
  
  return baseScore * (highestPriorityWeight / maxPriority);
}

/**
 * Get edge matching score (replicates original countMatchingEdges logic)
 */
function getEdgeMatchingScore(tile: TileData, context: OptimizationContext): number {
  const { grid, columns, position, row, col } = context;
  let matchCount = 0;
  
  // Check left neighbor
  if (col > 0) {
    const leftPos = position - 1;
    const leftTile = grid[leftPos]?.tile;
    if (leftTile && leftTile.edgeE === tile.edgeW) {
      matchCount++;
    }
  }
  
  // Check top neighbor
  if (row > 0) {
    const topPos = position - columns;
    const topTile = grid[topPos]?.tile;
    const tileEdgeS = tile.edgeS || (tile as any).EdgeS || '';
    if (topTile) {
      const topEdgeS = topTile.edgeS || (topTile as any).EdgeS || '';
      if (topEdgeS === tile.edgeN) {
        matchCount++;
      }
    }
  }
  
  return matchCount;
}

/**
 * Get mirror relationship score (replicates original isMirrorMatch logic)
 */
function getMirrorScore(tile: TileData, context: OptimizationContext): number {
  const { grid, columns, position, row, col } = context;
  
  // Check left neighbor for mirror relationship
  if (col > 0) {
    const leftPos = position - 1;
    const leftTile = grid[leftPos]?.tile;
    if (leftTile && (leftTile.mirrorH === tile.id || leftTile.mirrorV === tile.id)) {
      return 1;
    }
  }
  
  // Check top neighbor for mirror relationship
  if (row > 0) {
    const topPos = position - columns;
    const topTile = grid[topPos]?.tile;
    if (topTile && (topTile.mirrorH === tile.id || topTile.mirrorV === tile.id)) {
      return 1;
    }
  }
  
  return 0;
}

/**
 * Get rotation family score
 */
function getRotationScore(tile: TileData, context: OptimizationContext): number {
  // For now, return 0 as original implementation
  // Could be enhanced to check for rotation variants in adjacent positions
  return 0;
}

/**
 * Get shape clustering score
 */
function getShapeClusterScore(tile: TileData, context: OptimizationContext): number {
  const { grid, columns, position, row, col } = context;
  let shapeMatches = 0;
  
  // Check immediate neighbors only (not diagonals) for performance
  const neighborOffsets = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  
  neighborOffsets.forEach(([rowOffset, colOffset]) => {
    const adjRow = row + rowOffset;
    const adjCol = col + colOffset;
    
    if (adjRow >= 0 && adjRow < context.rows && adjCol >= 0 && adjCol < columns) {
      const adjPos = adjRow * columns + adjCol;
      const adjTile = grid[adjPos]?.tile;
      
      if (adjTile && adjTile.shape === tile.shape) {
        shapeMatches++;
      }
    }
  });
  
  return shapeMatches;
}

/**
 * Get distance penalty score
 */
function getDistancePenalty(tile: TileData, context: OptimizationContext): number {
  const { grid, position, columns } = context;
  
  // Find current position of this tile
  let currentPos = -1;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i].tile?.id === tile.id) {
      currentPos = i;
      break;
    }
  }
  
  if (currentPos === -1) return 0;
  
  // Calculate Manhattan distance
  const row1 = Math.floor(currentPos / columns);
  const col1 = currentPos % columns;
  const row2 = Math.floor(position / columns);
  const col2 = position % columns;
  const distance = Math.abs(row1 - row2) + Math.abs(col1 - col2);
  
  return -distance; // Negative penalty
}

/**
 * Generate position sequence based on traversal pattern
 */
function* generateTraversal(
  pattern: TraversalPattern, 
  columns: number, 
  rows: number
): Generator<number> {
  switch (pattern) {
    case 'row-major':
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
          yield row * columns + col;
        }
      }
      break;
      
    case 'column-major':
      for (let col = 0; col < columns; col++) {
        for (let row = 0; row < rows; row++) {
          yield row * columns + col;
        }
      }
      break;
      
    case 'spiral-clockwise':
      yield* generateSpiralTraversal(columns, rows, true);
      break;
      
    case 'spiral-counter':
      yield* generateSpiralTraversal(columns, rows, false);
      break;
      
    case 'diagonal':
      // Diagonal sweeps from top-left to bottom-right
      for (let d = 0; d < rows + columns - 1; d++) {
        for (let row = 0; row < rows; row++) {
          const col = d - row;
          if (col >= 0 && col < columns) {
            yield row * columns + col;
          }
        }
      }
      break;
      
    case 'block-2x2':
      // Process in 2x2 blocks
      for (let blockRow = 0; blockRow < rows; blockRow += 2) {
        for (let blockCol = 0; blockCol < columns; blockCol += 2) {
          for (let r = blockRow; r < Math.min(blockRow + 2, rows); r++) {
            for (let c = blockCol; c < Math.min(blockCol + 2, columns); c++) {
              yield r * columns + c;
            }
          }
        }
      }
      break;
      
    case 'checkerboard':
      // Checkerboard pattern: first all even positions, then odd
      for (let pass = 0; pass < 2; pass++) {
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < columns; col++) {
            if ((row + col) % 2 === pass) {
              yield row * columns + col;
            }
          }
        }
      }
      break;
      
    case 'random-walk':
      // Random traversal (for experimentation)
      const positions = Array.from({ length: rows * columns }, (_, i) => i);
      for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
      }
      for (const pos of positions) {
        yield pos;
      }
      break;
      
    default:
      // Fallback to row-major
      for (let i = 0; i < rows * columns; i++) {
        yield i;
      }
  }
}

/**
 * Generate spiral traversal pattern
 */
function* generateSpiralTraversal(
  columns: number, 
  rows: number, 
  clockwise: boolean
): Generator<number> {
  let top = 0, bottom = rows - 1, left = 0, right = columns - 1;
  
  while (top <= bottom && left <= right) {
    if (clockwise) {
      // Top row (left to right)
      for (let col = left; col <= right; col++) {
        yield top * columns + col;
      }
      top++;
      
      // Right column (top to bottom)
      for (let row = top; row <= bottom; row++) {
        yield row * columns + right;
      }
      right--;
      
      // Bottom row (right to left)
      if (top <= bottom) {
        for (let col = right; col >= left; col--) {
          yield bottom * columns + col;
        }
        bottom--;
      }
      
      // Left column (bottom to top)
      if (left <= right) {
        for (let row = bottom; row >= top; row--) {
          yield row * columns + left;
        }
        left++;
      }
    } else {
      // Counter-clockwise: reverse the order
      // Left column (top to bottom)
      for (let row = top; row <= bottom; row++) {
        yield row * columns + left;
      }
      left++;
      
      // Bottom row (left to right)
      if (top <= bottom) {
        for (let col = left; col <= right; col++) {
          yield bottom * columns + col;
        }
        bottom--;
      }
      
      // Right column (bottom to top)
      if (left <= right) {
        for (let row = bottom; row >= top; row--) {
          yield row * columns + right;
        }
        right--;
      }
      
      // Top row (right to left)
      if (top <= bottom) {
        for (let col = right; col >= left; col--) {
          yield top * columns + col;
        }
        top++;
      }
    }
  }
}

/**
 * Find best tile for a specific position using configurable scoring
 */
function findBestTileConfigurable(
  position: number,
  context: OptimizationContext,
  weights: OptimizationWeights
): { tileIndex: number; score: number } | null {
  const { grid, usedPositions } = context;
  let bestScore = -Infinity;
  let bestTileIndex: number | null = null;

  // Check all unused positions for tiles
  for (let i = 0; i < grid.length; i++) {
    if (usedPositions.has(i)) continue;
    
    const tile = grid[i].tile;
    if (!tile) continue;
    
    const score = calculateTileScore(tile, context, weights);

    if (score > bestScore) {
      bestScore = score;
      bestTileIndex = i;
    }
  }

  return bestTileIndex !== null ? { tileIndex: bestTileIndex, score: bestScore } : null;
}

/**
 * Swap tiles between positions (preserving coordinates)
 */
function swapTiles(grid: GridCell[], pos1: number, pos2: number): void {
  const tile1 = grid[pos1].tile;
  const tile2 = grid[pos2].tile;
  
  grid[pos1].tile = tile2;
  grid[pos2].tile = tile1;
}

/**
 * Main configurable optimization function
 */
export function optimizeGridConfigurable(
  grid: GridCell[],
  allTiles: TileData[],
  config: Partial<OptimizationConfig> = {}
): OptimizationResult {
  const startTime = performance.now();
  
  // Apply defaults and presets
  const finalConfig: OptimizationConfig = {
    weights: config.weights || DEFAULT_WEIGHTS,
    traversal: config.traversal || 'row-major',
    scoringFunctions: config.scoringFunctions || DEFAULT_SCORING_FUNCTIONS,
    maxIterations: config.maxIterations || 1,
    convergenceThreshold: config.convergenceThreshold || 0.001,
    multiPass: config.multiPass || false,
    debug: config.debug || false
  };

  // Build tile relationships
  const relationships = buildTileRelationships(allTiles);
  
  const columns = 12; // TODO: Make configurable
  const rows = Math.ceil(grid.length / columns);
  const newGrid = [...grid.map(cell => ({ ...cell, tile: cell.tile ? { ...cell.tile } : cell.tile }))];
  
  let totalSwaps = 0;
  let iteration = 0;
  const scoreHistory: number[] = [];
  let converged = false;

  // Main optimization loop
  for (iteration = 0; iteration < finalConfig.maxIterations; iteration++) {
    const usedPositions = new Set<number>();
    let iterationSwaps = 0;
    
    // Process positions according to traversal pattern
    const traversal = generateTraversal(finalConfig.traversal, columns, rows);
    
    for (const position of traversal) {
      if (position >= newGrid.length) continue;
      
      const row = Math.floor(position / columns);
      const col = position % columns;
      
      const context: OptimizationContext = {
        grid: newGrid,
        columns,
        rows,
        position,
        row,
        col,
        relationships,
        usedPositions
      };
      
      // Find the best tile for this position
      const result = findBestTileConfigurable(position, context, finalConfig.weights);
      
      if (result && result.tileIndex !== position) {
        // Swap the best tile to current position
        swapTiles(newGrid, position, result.tileIndex);
        iterationSwaps++;
        totalSwaps++;
        
        if (finalConfig.debug) {
          console.log(`Iteration ${iteration}, Position ${position}: Swapped with ${result.tileIndex}, Score: ${result.score}`);
        }
      }
      
      // Mark current position as used
      usedPositions.add(position);
    }
    
    // Calculate iteration score (could be enhanced with comprehensive scoring)
    const iterationScore = iterationSwaps; // Simplified
    scoreHistory.push(iterationScore);
    
    // Check convergence
    if (iterationSwaps === 0) {
      converged = true;
      break;
    }
    
    if (finalConfig.debug) {
      console.log(`Iteration ${iteration} complete: ${iterationSwaps} swaps`);
    }
  }
  
  const executionTime = performance.now() - startTime;
  
  return {
    grid: newGrid,
    swaps: totalSwaps,
    iterations: iteration + 1,
    finalScore: scoreHistory[scoreHistory.length - 1] || 0,
    scoreHistory,
    converged,
    executionTime,
    config: finalConfig
  };
}

/**
 * Convenience function using preset configurations
 */
export function optimizeWithPreset(
  grid: GridCell[],
  allTiles: TileData[],
  presetName: keyof typeof OPTIMIZATION_PRESETS
): OptimizationResult {
  const preset = OPTIMIZATION_PRESETS[presetName];
  return optimizeGridConfigurable(grid, allTiles, preset);
}

/**
 * Single-color optimization convenience function
 */
export function optimizeForSingleColor(
  grid: GridCell[],
  allTiles: TileData[],
  color: 'a' | 'b' | 'c' | 'd'
): OptimizationResult {
  const colorWeights = { a: 0.1, b: 0.1, c: 0.1, d: 0.1 };
  colorWeights[color] = 10;
  
  const config: Partial<OptimizationConfig> = {
    weights: {
      ...DEFAULT_WEIGHTS,
      edgeMatching: 100,
      colorPriority: colorWeights,
      mirrorBonus: 10,
      rotationBonus: 5
    },
    traversal: 'row-major'
  };
  
  return optimizeGridConfigurable(grid, allTiles, config);
}