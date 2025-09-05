/**
 * Grid analysis functions and scoring
 */

import { TileData } from '../../components/CSVTable';
import { GridCell, TileRelationships, PatternScore, MirrorPair } from './types';

/**
 * Calculate comprehensive pattern quality score for entire grid
 */
export function calculatePatternScore(grid: GridCell[], relationships: TileRelationships): PatternScore {
  const edgeScore = calculateEdgeMatchScore(grid);
  const mirrorScore = calculateMirrorScore(grid, relationships);
  const colorBalance = calculateColorBalance(grid);
  const flowScore = calculateFlowScore(grid, relationships);
  
  const totalScore = edgeScore * 0.4 + mirrorScore * 0.3 + colorBalance * 0.2 + flowScore * 0.1;
  
  return {
    edgeScore,
    mirrorScore,
    colorBalance,
    flowScore,
    totalScore
  };
}

/**
 * Find all mirror pairs in current grid with their positions and distances
 */
export function findAllMirrorPairs(grid: GridCell[], relationships: TileRelationships): MirrorPair[] {
  const pairs: MirrorPair[] = [];
  const gridWidth = 12;
  
  for (let i = 0; i < grid.length; i++) {
    const cell = grid[i];
    if (!cell.tile) continue;
    
    const mirrorInfo = relationships.mirrorMap.get(cell.tile.id);
    if (!mirrorInfo) continue;
    
    // Check horizontal mirrors
    if (mirrorInfo.horizontal) {
      const horizontalMirrorPositions = findTilePositionsInGrid(grid, mirrorInfo.horizontal);
      for (const pos of horizontalMirrorPositions) {
        if (pos > i) { // Avoid duplicates
          const row1 = Math.floor(i / gridWidth);
          const col1 = i % gridWidth;
          const row2 = Math.floor(pos / gridWidth);
          const col2 = pos % gridWidth;
          const distance = Math.abs(col1 - col2) + Math.abs(row1 - row2);
          
          pairs.push({
            pos1: i,
            pos2: pos,
            direction: 'horizontal',
            distance
          });
        }
      }
    }
    
    // Check vertical mirrors
    if (mirrorInfo.vertical) {
      const verticalMirrorPositions = findTilePositionsInGrid(grid, mirrorInfo.vertical);
      for (const pos of verticalMirrorPositions) {
        if (pos > i) { // Avoid duplicates
          const row1 = Math.floor(i / gridWidth);
          const col1 = i % gridWidth;
          const row2 = Math.floor(pos / gridWidth);
          const col2 = pos % gridWidth;
          const distance = Math.abs(col1 - col2) + Math.abs(row1 - row2);
          
          pairs.push({
            pos1: i,
            pos2: pos,
            direction: 'vertical',
            distance
          });
        }
      }
    }
  }
  
  return pairs;
}

/**
 * Iterative improvement engine - generic pattern optimizer
 */
export function iterativeImprove(
  grid: GridCell[],
  scoreFn: (grid: GridCell[]) => number,
  maxIterations: number,
  improvementThreshold: number = 0.01
): GridCell[] {
  let currentGrid = [...grid];
  let bestScore = scoreFn(currentGrid);
  let iterations = 0;
  
  console.log(`🔄 Starting iterative improvement. Initial score: ${bestScore.toFixed(2)}`);
  
  while (iterations < maxIterations) {
    const candidateGrid = [...currentGrid];
    let improved = false;
    
    // Try random swaps to find improvements
    for (let attempts = 0; attempts < 50; attempts++) {
      const pos1 = Math.floor(Math.random() * candidateGrid.length);
      const pos2 = Math.floor(Math.random() * candidateGrid.length);
      
      if (pos1 === pos2 || !candidateGrid[pos1].tile || !candidateGrid[pos2].tile) continue;
      
      // Try swap
      swapTilesNoHistory(candidateGrid, pos1, pos2);
      const newScore = scoreFn(candidateGrid);
      
      if (newScore > bestScore + improvementThreshold) {
        bestScore = newScore;
        currentGrid = [...candidateGrid];
        improved = true;
        console.log(`✅ Improvement found! New score: ${bestScore.toFixed(2)}`);
        break;
      } else {
        // Revert swap
        swapTilesNoHistory(candidateGrid, pos1, pos2);
      }
    }
    
    if (!improved) {
      console.log(`🛑 No improvement found in iteration ${iterations + 1}. Stopping.`);
      break;
    }
    
    iterations++;
  }
  
  console.log(`🏁 Completed ${iterations} iterations. Final score: ${bestScore.toFixed(2)}`);
  return currentGrid;
}

// Helper scoring functions
function calculateEdgeMatchScore(grid: GridCell[]): number {
  const gridWidth = 12;
  let matches = 0;
  let total = 0;
  
  for (let i = 0; i < grid.length; i++) {
    const cell = grid[i];
    if (!cell.tile) continue;
    
    const row = Math.floor(i / gridWidth);
    const col = i % gridWidth;
    
    // Check right neighbor
    if (col < gridWidth - 1) {
      const rightCell = grid[i + 1];
      if (rightCell.tile) {
        if (cell.tile.edgeE === rightCell.tile.edgeW) matches++;
        total++;
      }
    }
    
    // Check bottom neighbor
    if (row < 7) {
      const bottomCell = grid[i + gridWidth];
      if (bottomCell.tile) {
        if (cell.tile.edgeS === bottomCell.tile.edgeN) matches++;
        total++;
      }
    }
  }
  
  return total > 0 ? matches / total : 0;
}

function calculateMirrorScore(grid: GridCell[], relationships: TileRelationships): number {
  const mirrorPairs = findAllMirrorPairs(grid, relationships);
  const gridWidth = 12;
  
  let score = 0;
  for (const pair of mirrorPairs) {
    const row1 = Math.floor(pair.pos1 / gridWidth);
    const col1 = pair.pos1 % gridWidth;
    const row2 = Math.floor(pair.pos2 / gridWidth);
    const col2 = pair.pos2 % gridWidth;
    
    const horizontalDistance = Math.abs(col1 - col2);
    const verticalDistance = Math.abs(row1 - row2);
    
    // Check if mirrors are placed in correct orientation
    let orientationBonus = 0;
    if (pair.direction === 'horizontal') {
      // Horizontal mirrors should be placed horizontally adjacent (same row, adjacent columns)
      if (row1 === row2 && horizontalDistance === 1) {
        orientationBonus = 20; // Big bonus for perfect horizontal placement
      } else if (row1 === row2 && horizontalDistance <= 3) {
        orientationBonus = 10; // Medium bonus for same row, close horizontally
      } else if (horizontalDistance <= verticalDistance) {
        orientationBonus = 5; // Small bonus if more horizontal than vertical separation
      }
    } else if (pair.direction === 'vertical') {
      // Vertical mirrors should be placed vertically adjacent (same column, adjacent rows)
      if (col1 === col2 && verticalDistance === 1) {
        orientationBonus = 20; // Big bonus for perfect vertical placement
      } else if (col1 === col2 && verticalDistance <= 3) {
        orientationBonus = 10; // Medium bonus for same column, close vertically
      } else if (verticalDistance <= horizontalDistance) {
        orientationBonus = 5; // Small bonus if more vertical than horizontal separation
      }
    }
    
    // Base proximity score
    let proximityScore = 0;
    if (pair.distance === 1) {
      proximityScore = 8;
    } else if (pair.distance === 2) {
      proximityScore = 4;
    } else if (pair.distance <= 4) {
      proximityScore = 2;
    } else {
      proximityScore = 1;
    }
    
    score += orientationBonus + proximityScore;
  }
  
  return score;
}

function calculateColorBalance(grid: GridCell[]): number {
  const colorCounts = { a: 0, b: 0, c: 0, d: 0 };
  let totalEdges = 0;
  
  for (const cell of grid) {
    if (cell.tile) {
      [cell.tile.edgeN, cell.tile.edgeE, cell.tile.edgeS, cell.tile.edgeW].forEach(edge => {
        if (edge === 'a') colorCounts.a++;
        else if (edge === 'b') colorCounts.b++;
        else if (edge === 'c') colorCounts.c++;
        else if (edge === 'd') colorCounts.d++;
        totalEdges++;
      });
    }
  }
  
  if (totalEdges === 0) return 0;
  
  const idealRatio = 1/4; // Now 4 colors instead of 3
  const aRatio = colorCounts.a / totalEdges;
  const bRatio = colorCounts.b / totalEdges;
  const cRatio = colorCounts.c / totalEdges;
  const dRatio = colorCounts.d / totalEdges;
  
  // Deviation from ideal balance
  const deviation = Math.abs(aRatio - idealRatio) + 
                   Math.abs(bRatio - idealRatio) + 
                   Math.abs(cRatio - idealRatio) +
                   Math.abs(dRatio - idealRatio);
  
  return 1 - deviation; // Higher score for better balance
}

function calculateFlowScore(grid: GridCell[], relationships: TileRelationships): number {
  // Simple flow score based on rotation family continuity
  let flowScore = 0;
  const gridWidth = 12;
  
  for (let i = 0; i < grid.length; i++) {
    const cell = grid[i];
    if (!cell.tile) continue;
    
    const row = Math.floor(i / gridWidth);
    const col = i % gridWidth;
    
    // Check if neighbors are in same rotation family
    if (col < gridWidth - 1) {
      const rightCell = grid[i + 1];
      if (rightCell.tile && cell.tile.shape === rightCell.tile.shape) {
        flowScore += 1;
      }
    }
    
    if (row < 7) {
      const bottomCell = grid[i + gridWidth];
      if (bottomCell.tile && cell.tile.shape === bottomCell.tile.shape) {
        flowScore += 1;
      }
    }
  }
  
  return flowScore;
}

function findTilePositionsInGrid(grid: GridCell[], tileId: string): number[] {
  const positions: number[] = [];
  for (let i = 0; i < grid.length; i++) {
    if (grid[i].tile?.id === tileId) {
      positions.push(i);
    }
  }
  return positions;
}

// Helper function for swapping tiles
function swapTilesNoHistory(grid: GridCell[], pos1: number, pos2: number): void {
  // Only swap the tiles, keep x,y coordinates correct
  const tile1 = grid[pos1].tile;
  const tile2 = grid[pos2].tile;
  
  grid[pos1].tile = tile2;
  grid[pos2].tile = tile1;
}