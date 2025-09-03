// Simplified Pattern Functions - Just the essentials
import { TileData } from './CSVTable';

interface GridCell {
  x: number;
  y: number;
  tile?: TileData;
  rotation?: number;
}

/**
 * Fill grid with all 96 tiles, using each tile exactly once
 * As specified in CLAUDE.md and SIMPLE_STEP_BY_STEP_PLAN.md
 */
export function fillGrid(grid: GridCell[], allTiles: TileData[]): GridCell[] {
  // Create a copy of the grid to avoid mutations
  const newGrid = [...grid];
  
  // Track which tiles are already placed
  const usedTileIds = new Set<string>();
  
  // First pass: identify tiles that are already on the grid
  for (const cell of newGrid) {
    if (cell.tile && cell.tile.id) {
      usedTileIds.add(cell.tile.id);
    }
  }
  
  // Get list of unused tiles
  const unusedTiles = allTiles.filter(tile => !usedTileIds.has(tile.id));
  
  // Second pass: fill empty cells with unused tiles
  let unusedTileIndex = 0;
  
  for (let i = 0; i < newGrid.length; i++) {
    // Only fill empty cells
    if (!newGrid[i].tile && unusedTileIndex < unusedTiles.length) {
      newGrid[i] = {
        ...newGrid[i],
        tile: unusedTiles[unusedTileIndex],
        rotation: 0 // Start with no rotation
      };
      unusedTileIndex++;
    }
  }
  
  return newGrid;
}

/**
 * Optimize edge matching - the beautiful pattern function
 * This is the core algorithm that creates beautiful patterns
 */
export function optimizeEdgeMatching(
  grid: GridCell[], 
  gridWidth: number = 12,
  gridHeight: number = 8
): GridCell[] {
  const newGrid = [...grid];
  const used = new Set<number>();
  
  // Process each position from top-left to bottom-right
  for (let row = 0; row < gridHeight; row++) {
    for (let col = 0; col < gridWidth; col++) {
      const currentPos = row * gridWidth + col;
      
      if (currentPos >= newGrid.length) break;
      
      // Find the best tile for this position
      const bestTilePos = findBestTileForPosition(
        currentPos, 
        row, 
        col, 
        used, 
        newGrid,
        gridWidth,
        gridHeight
      );
      
      if (bestTilePos !== null && bestTilePos !== currentPos) {
        // Swap tiles
        const temp = newGrid[currentPos];
        newGrid[currentPos] = newGrid[bestTilePos];
        newGrid[bestTilePos] = temp;
      }
      
      // Mark position as used
      used.add(currentPos);
    }
  }
  
  return newGrid;
}

/**
 * Find the best tile for a given position based on edge matching
 */
function findBestTileForPosition(
  targetPos: number,
  row: number,
  col: number,
  used: Set<number>,
  grid: GridCell[],
  gridWidth: number,
  gridHeight: number
): number | null {
  let bestScore = -Infinity;
  let bestPos: number | null = null;
  
  // Check all unused positions
  for (let pos = 0; pos < grid.length; pos++) {
    if (used.has(pos) || !grid[pos].tile) continue;
    
    let score = 0;
    const tile = grid[pos].tile;
    
    // Score based on edge matches with neighbors
    // Check left neighbor
    if (col > 0) {
      const leftPos = targetPos - 1;
      if (grid[leftPos].tile) {
        score += calculateEdgeMatch(tile, grid[leftPos].tile, 'left');
      }
    }
    
    // Check top neighbor
    if (row > 0) {
      const topPos = targetPos - gridWidth;
      if (grid[topPos].tile) {
        score += calculateEdgeMatch(tile, grid[topPos].tile, 'top');
      }
    }
    
    // Check right neighbor (if already placed)
    if (col < gridWidth - 1) {
      const rightPos = targetPos + 1;
      if (used.has(rightPos) && grid[rightPos].tile) {
        score += calculateEdgeMatch(tile, grid[rightPos].tile, 'right');
      }
    }
    
    // Check bottom neighbor (if already placed)
    if (row < gridHeight - 1) {
      const bottomPos = targetPos + gridWidth;
      if (used.has(bottomPos) && grid[bottomPos].tile) {
        score += calculateEdgeMatch(tile, grid[bottomPos].tile, 'bottom');
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestPos = pos;
    }
  }
  
  return bestPos;
}

/**
 * Calculate edge match score between two tiles
 */
function calculateEdgeMatch(
  tile1: TileData, 
  tile2: TileData, 
  direction: 'top' | 'right' | 'bottom' | 'left'
): number {
  // Get edge colors based on direction
  let edge1, edge2;
  
  switch (direction) {
    case 'left':
      // tile1's left edge matches tile2's right edge
      edge1 = tile1.edge1; // left edge
      edge2 = tile2.edge3; // right edge
      break;
    case 'top':
      // tile1's top edge matches tile2's bottom edge
      edge1 = tile1.edge2; // top edge
      edge2 = tile2.edge1 + '-' + tile2.edge3; // bottom edge (composite)
      break;
    case 'right':
      // tile1's right edge matches tile2's left edge
      edge1 = tile1.edge3; // right edge
      edge2 = tile2.edge1; // left edge
      break;
    case 'bottom':
      // tile1's bottom edge matches tile2's top edge
      edge1 = tile1.edge1 + '-' + tile1.edge3; // bottom edge (composite)
      edge2 = tile2.edge2; // top edge
      break;
  }
  
  // Return 10 points for matching edges
  return edge1 === edge2 ? 10 : 0;
}

/**
 * Clear the grid - remove all tiles
 */
export function clearGrid(grid: GridCell[]): GridCell[] {
  return grid.map(cell => ({
    ...cell,
    tile: undefined,
    rotation: 0
  }));
}

// Export all functions as a single object for easy access
export const SimplifiedFunctions = {
  fillGrid,
  optimizeEdgeMatching,
  clearGrid
};