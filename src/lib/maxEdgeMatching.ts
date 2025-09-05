/**
 * MAXIMUM EDGE MATCHING OPTIMIZATION ALGORITHM
 * Implements iterative optimization to maximize color matches between adjacent tile edges
 * Based on the algorithm described in CLAUDE.md
 */

import { TileData } from '@/components/CSVTable';
import { getNESW, buildTileMaps } from '@/lib/dataPrep';

export interface GridCell {
  x: number;
  y: number;
  tile?: TileData;
}

export interface OptimizationResult {
  grid: GridCell[];
  score: number;
  iterations: number;
  improvements: number[];
  timeElapsed: number;
}

export interface OptimizationProgress {
  iteration: number;
  score: number;
  phase: 'swap' | 'complete';
  position?: string;
}

// Calculate total matching edges score for entire grid
export function calculateTotalScore(grid: GridCell[], columns: number = 12): number {
  let score = 0;
  const rows = Math.ceil(grid.length / columns);
  
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const index = y * columns + x;
      const cell = grid[index];
      
      if (!cell?.tile) continue;
      
      const tileEdges = getNESW(cell.tile);
      
      // Check East neighbor (right)
      if (x < columns - 1) {
        const rightIndex = index + 1;
        const rightCell = grid[rightIndex];
        if (rightCell?.tile) {
          const rightEdges = getNESW(rightCell.tile);
          if (tileEdges.E === rightEdges.W) score++;
        }
      }
      
      // Check South neighbor (below)
      if (y < rows - 1) {
        const belowIndex = index + columns;
        const belowCell = grid[belowIndex];
        if (belowCell?.tile) {
          const belowEdges = getNESW(belowCell.tile);
          if (tileEdges.S === belowEdges.N) score++;
        }
      }
    }
  }
  
  return score;
}

// Calculate score for a single tile position (checking its neighbors)
export function getNeighborScore(
  grid: GridCell[], 
  position: number, 
  tile: TileData,
  columns: number = 12
): number {
  let score = 0;
  const rows = Math.ceil(grid.length / columns);
  const x = position % columns;
  const y = Math.floor(position / columns);
  
  const tileEdges = getNESW(tile);
  
  // Check North neighbor
  if (y > 0) {
    const northIndex = position - columns;
    const northCell = grid[northIndex];
    if (northCell?.tile) {
      const northEdges = getNESW(northCell.tile);
      if (tileEdges.N === northEdges.S) score++;
    }
  }
  
  // Check East neighbor
  if (x < columns - 1) {
    const eastIndex = position + 1;
    const eastCell = grid[eastIndex];
    if (eastCell?.tile) {
      const eastEdges = getNESW(eastCell.tile);
      if (tileEdges.E === eastEdges.W) score++;
    }
  }
  
  // Check South neighbor
  if (y < rows - 1) {
    const southIndex = position + columns;
    const southCell = grid[southIndex];
    if (southCell?.tile) {
      const southEdges = getNESW(southCell.tile);
      if (tileEdges.S === southEdges.N) score++;
    }
  }
  
  // Check West neighbor
  if (x > 0) {
    const westIndex = position - 1;
    const westCell = grid[westIndex];
    if (westCell?.tile) {
      const westEdges = getNESW(westCell.tile);
      if (tileEdges.W === westEdges.E) score++;
    }
  }
  
  return score;
}

// Optimize rotation for a single tile position
export function optimizeRotation(
  grid: GridCell[], 
  position: number, 
  allTiles: TileData[],
  columns: number = 12
): { improved: boolean; newGrid: GridCell[] } {
  const currentCell = grid[position];
  if (!currentCell?.tile) return { improved: false, newGrid: grid };
  
  const { byId } = buildTileMaps(allTiles);
  const currentTile = currentCell.tile;
  
  // Get all rotation variants
  const rotationIds = [
    currentTile.rotation0,
    currentTile.rotation90,
    currentTile.rotation180,
    currentTile.rotation270
  ];
  
  let bestScore = getNeighborScore(grid, position, currentTile, columns);
  let bestTile = currentTile;
  let improved = false;
  
  // Try each rotation
  for (const rotId of rotationIds) {
    if (!rotId) continue;
    const rotTile = byId.get(rotId);
    if (!rotTile) continue;
    
    const score = getNeighborScore(grid, position, rotTile, columns);
    if (score > bestScore) {
      bestScore = score;
      bestTile = rotTile;
      improved = true;
    }
  }
  
  // Apply best rotation if improved
  if (improved) {
    const newGrid = [...grid];
    newGrid[position] = { ...currentCell, tile: bestTile };
    return { improved: true, newGrid };
  }
  
  return { improved: false, newGrid: grid };
}

// Optimize by swapping with other tiles
export function optimizeSwaps(
  grid: GridCell[], 
  position: number,
  columns: number = 12
): { improved: boolean; newGrid: GridCell[]; swappedWith?: number } {
  const currentCell = grid[position];
  if (!currentCell?.tile) return { improved: false, newGrid: grid };
  
  const currentScore = calculateTotalScore(grid, columns);
  let bestScore = currentScore;
  let bestSwapIndex = -1;
  
  // Try swapping with every other tile
  for (let i = 0; i < grid.length; i++) {
    if (i === position) continue;
    
    const otherCell = grid[i];
    if (!otherCell?.tile) continue;
    
    // Create swapped grid
    const testGrid = [...grid];
    [testGrid[position], testGrid[i]] = [
      { ...grid[i], x: currentCell.x, y: currentCell.y },
      { ...grid[position], x: otherCell.x, y: otherCell.y }
    ];
    
    const score = calculateTotalScore(testGrid, columns);
    if (score > bestScore) {
      bestScore = score;
      bestSwapIndex = i;
    }
  }
  
  // Apply best swap if improved
  if (bestSwapIndex >= 0) {
    const newGrid = [...grid];
    const otherCell = grid[bestSwapIndex];
    [newGrid[position], newGrid[bestSwapIndex]] = [
      { ...grid[bestSwapIndex], x: currentCell.x, y: currentCell.y },
      { ...grid[position], x: otherCell.x, y: otherCell.y }
    ];
    return { improved: true, newGrid, swappedWith: bestSwapIndex };
  }
  
  return { improved: false, newGrid: grid };
}

// Main optimization algorithm
export function maximizeEdgeMatching(
  allTiles: TileData[],
  initialGrid?: GridCell[],
  gridWidth: number = 12,
  gridHeight: number = 8,
  maxIterations: number = 50,
  onProgress?: (progress: OptimizationProgress) => void
): OptimizationResult {
  const startTime = Date.now();
  console.log('🎯 Starting Maximum Edge Matching Optimization...');
  
  // Initialize grid with random tile placement if not provided
  let grid: GridCell[];
  if (initialGrid && initialGrid.length > 0 && initialGrid.some(c => c.tile)) {
    grid = [...initialGrid];
    console.log('📊 Using provided initial grid');
  } else {
    grid = [];
    const shuffledTiles = [...allTiles].sort(() => Math.random() - 0.5);
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const index = y * gridWidth + x;
        grid.push({
          x,
          y,
          tile: index < shuffledTiles.length ? shuffledTiles[index] : undefined
        });
      }
    }
    console.log('🎲 Initialized with random tile placement');
  }
  
  let currentScore = calculateTotalScore(grid, gridWidth);
  const improvements: number[] = [currentScore];
  let iterations = 0;
  let hasImproved = true;
  
  console.log(`📊 Initial score: ${currentScore}`);
  
  // Main optimization loop
  while (hasImproved && iterations < maxIterations) {
    iterations++;
    hasImproved = false;
    const iterationStartScore = currentScore;
    
    console.log(`\n🔄 Iteration ${iterations}:`);
    
    // Only optimize by swapping tiles (no rotations to avoid duplicates)
    console.log('  🔄 Optimizing tile positions (swapping)...');
    for (let i = 0; i < grid.length; i++) {
      if (!grid[i]?.tile) continue;
      
      const result = optimizeSwaps(grid, i, gridWidth);
      if (result.improved) {
        grid = result.newGrid;
        hasImproved = true;
        if (result.swappedWith !== undefined) {
          console.log(`    Swapped position ${i} with ${result.swappedWith}`);
        }
      }
      
      // Report progress
      if (onProgress && i % 10 === 0) {
        onProgress({
          iteration: iterations,
          score: calculateTotalScore(grid, gridWidth),
          phase: 'swap',
          position: `${i + 1}/${grid.length}`
        });
      }
    }
    
    currentScore = calculateTotalScore(grid, gridWidth);
    improvements.push(currentScore);
    
    const iterationImprovement = currentScore - iterationStartScore;
    console.log(`  ✅ Iteration ${iterations} complete: Score ${currentScore} (${iterationImprovement >= 0 ? '+' : ''}${iterationImprovement})`);
    
    // Check for convergence
    if (!hasImproved) {
      console.log('🏁 Converged - no further improvements possible');
      break;
    }
  }
  
  const timeElapsed = Date.now() - startTime;
  const finalScore = calculateTotalScore(grid, gridWidth);
  const maxPossible = (gridWidth - 1) * gridHeight + gridWidth * (gridHeight - 1);
  const percentage = ((finalScore / maxPossible) * 100).toFixed(1);
  
  console.log('\n📊 Optimization Complete:');
  console.log(`  Final score: ${finalScore}/${maxPossible} (${percentage}%)`);
  console.log(`  Iterations: ${iterations}`);
  console.log(`  Time: ${timeElapsed}ms`);
  console.log(`  Total improvement: ${finalScore - improvements[0]}`);
  
  // Report completion
  if (onProgress) {
    onProgress({
      iteration: iterations,
      score: finalScore,
      phase: 'complete'
    });
  }
  
  return {
    grid,
    score: finalScore,
    iterations,
    improvements,
    timeElapsed
  };
}

// Helper function to visualize the score distribution
export function getScoreHeatmap(grid: GridCell[], columns: number = 12): number[] {
  const scores: number[] = [];
  
  for (let i = 0; i < grid.length; i++) {
    if (grid[i]?.tile) {
      scores.push(getNeighborScore(grid, i, grid[i].tile!, columns));
    } else {
      scores.push(0);
    }
  }
  
  return scores;
}

// Quick optimization - single iteration for testing
export function quickOptimize(
  grid: GridCell[],
  allTiles: TileData[],
  columns: number = 12
): GridCell[] {
  let optimizedGrid = [...grid];
  
  // Just do rotation optimization
  for (let i = 0; i < optimizedGrid.length; i++) {
    const result = optimizeRotation(optimizedGrid, i, allTiles, columns);
    if (result.improved) {
      optimizedGrid = result.newGrid;
    }
  }
  
  return optimizedGrid;
}