/**
 * Grid filling algorithms
 */

import { TileData } from '../../components/CSVTable';
import { GridCell } from './types';

/**
 * Fill grid with all 96 tiles
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
        tile: unusedTiles[tileIndex]
      };
      tileIndex++;
    }
  }
  
  return newGrid;
}