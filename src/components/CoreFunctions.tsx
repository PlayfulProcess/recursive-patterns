/**
 * CORE FUNCTIONS - Minimal Implementation
 * Starting fresh with only essential functions
 * As per CLAUDE.md - building one function at a time
 */

import { TileData } from './CSVTable';

// Data structure for grid cells
export interface GridCell {
  x: number;
  y: number;
  tile?: TileData;
  rotation?: number;
}

// Result type for function execution
export interface FunctionResult {
  success: boolean;
  message: string;
  gridState?: GridCell[];
}

/**
 * STEP 1: fillGrid - Fill grid with all 96 tiles
 * Each tile used exactly once, no duplicates
 * Fills only empty cells with unused tiles
 */
export function fillGrid(grid: GridCell[], allTiles: TileData[]): GridCell[] {
  // Create a copy to avoid mutations
  const newGrid = [...grid];
  
  // Track which tiles are already placed
  const usedTileIds = new Set<string>();
  
  // First: identify already placed tiles
  for (const cell of newGrid) {
    if (cell.tile && cell.tile.id) {
      usedTileIds.add(cell.tile.id);
    }
  }
  
  // Get unused tiles
  const unusedTiles = allTiles.filter(tile => !usedTileIds.has(tile.id));
  
  // Fill empty cells with unused tiles
  let tileIndex = 0;
  for (let i = 0; i < newGrid.length; i++) {
    if (!newGrid[i].tile && tileIndex < unusedTiles.length) {
      newGrid[i] = {
        ...newGrid[i],
        tile: unusedTiles[tileIndex],
        rotation: 0
      };
      tileIndex++;
    }
  }
  
  return newGrid;
}

/**
 * STEP 2: optimizeEdgeMatching - Create beautiful patterns
 * Implements the reference algorithm with proper scoring
 */
export function optimizeEdgeMatching(grid: GridCell[], gridWidth: number = 12, gridHeight: number = 8): GridCell[] {
  const newGrid = [...grid];
  const used = new Set<number>();
  let totalSwaps = 0;
  
  console.log('🎨 Starting edge matching optimization...');
  
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
        // Swap tiles to optimize edge matching
        const temp = { ...newGrid[currentPos] };
        newGrid[currentPos] = { ...newGrid[bestTilePos] };
        newGrid[bestTilePos] = temp;
        totalSwaps++;
      }
      
      // Mark position as used
      used.add(currentPos);
    }
  }
  
  console.log(`🎨 Edge matching complete - ${totalSwaps} optimizations made`);
  return newGrid;
}

/**
 * Find the best tile for a given position based on edge matching scores
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
    
    const score = calculateEdgeMatchScore(
      grid[pos].tile!,
      targetPos,
      row,
      col,
      grid,
      gridWidth,
      gridHeight
    );
    
    if (score > bestScore) {
      bestScore = score;
      bestPos = pos;
    }
  }
  
  return bestPos;
}

/**
 * Calculate edge match score between tile and its future neighbors
 */
function calculateEdgeMatchScore(
  tile: any,
  targetPos: number,
  row: number,
  col: number,
  grid: GridCell[],
  gridWidth: number,
  gridHeight: number
): number {
  let score = 0;
  
  // Get edge colors for this tile
  const tileEdges = getTileEdgeColors(tile, 0); // No rotation for now
  
  // Check left neighbor
  if (col > 0) {
    const leftPos = targetPos - 1;
    if (leftPos >= 0 && grid[leftPos].tile) {
      const leftEdges = getTileEdgeColors(grid[leftPos].tile!, grid[leftPos].rotation || 0);
      if (leftEdges.right === tileEdges.left) {
        score += 10; // Edge match score
      }
    }
  }
  
  // Check top neighbor  
  if (row > 0) {
    const topPos = targetPos - gridWidth;
    if (topPos >= 0 && grid[topPos].tile) {
      const topEdges = getTileEdgeColors(grid[topPos].tile!, grid[topPos].rotation || 0);
      if (topEdges.bottom === tileEdges.top) {
        score += 10; // Edge match score
      }
    }
  }
  
  // Check right neighbor (if already placed)
  if (col < gridWidth - 1) {
    const rightPos = targetPos + 1;
    if (rightPos < grid.length && grid[rightPos].tile) {
      const rightEdges = getTileEdgeColors(grid[rightPos].tile!, grid[rightPos].rotation || 0);
      if (rightEdges.left === tileEdges.right) {
        score += 10; // Edge match score
      }
    }
  }
  
  // Check bottom neighbor (if already placed)
  if (row < gridHeight - 1) {
    const bottomPos = targetPos + gridWidth;
    if (bottomPos < grid.length && grid[bottomPos].tile) {
      const bottomEdges = getTileEdgeColors(grid[bottomPos].tile!, grid[bottomPos].rotation || 0);
      if (bottomEdges.top === tileEdges.bottom) {
        score += 10; // Edge match score
      }
    }
  }
  
  return score;
}

/**
 * Get edge colors for a tile with rotation
 */
function getTileEdgeColors(tile: any, rotation: number = 0) {
  // Base edge structure: left triangle (edge1), top-right (edge2), bottom-right (edge3)
  let edges = {
    top: tile.edge2,    // Top edge: from top-right triangle
    right: tile.edge3,  // Right edge: from bottom-right triangle  
    bottom: tile.edge1 + '-' + tile.edge3, // Bottom: composite edge
    left: tile.edge1    // Left edge: from left triangle
  };
  
  // Apply rotation (90-degree steps)
  const rotations = Math.floor((rotation || 0) / 90);
  for (let r = 0; r < rotations; r++) {
    const temp = edges.top;
    edges.top = edges.left;
    edges.left = edges.bottom;
    edges.bottom = edges.right;
    edges.right = temp;
  }
  
  return edges;
}

// Export all functions for easy access
export const CoreFunctions = {
  fillGrid,
  optimizeEdgeMatching
};