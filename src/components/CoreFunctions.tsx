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
 * To be implemented after fillGrid is tested and working
 */
export function optimizeEdgeMatching(grid: GridCell[]): GridCell[] {
  // TODO: Implement after fillGrid is tested
  console.log('optimizeEdgeMatching: To be implemented');
  return grid;
}

// Export all functions for easy access
export const CoreFunctions = {
  fillGrid,
  optimizeEdgeMatching
};