/**
 * EDGE MATCHING OPTIMIZATION MODULE
 * Implements the exact same iterative edge matching function from the old repo
 * Following Copilot's suggested approach for clean tile optimization
 */

import { TileData } from '@/components/CSVTable';
import { getNESW } from '@/lib/dataPrep';

export interface GridCell {
  x: number;
  y: number;
  tile?: TileData;
}

// Score-based tile evaluation for best fit
export function findBestTileForPosition(
  currentPos: number,
  row: number,
  col: number,
  used: Set<number>,
  grid: GridCell[],
  allTiles: TileData[],
  columns: number
): number | null {
  let bestScore = -Infinity;
  let bestTileIndex: number | null = null;

  for (let i = 0; i < allTiles.length; i++) {
    if (used.has(i)) continue;

    const tile = allTiles[i];
    let score = 0;

    // Mirror match priority (highest weight)
    if (isMirrorMatch(tile, grid, row, col, columns)) score += 100;

    // Rotation match priority (medium weight)  
    if (isRotationMatch(tile, grid, row, col, columns)) score += 50;

    // Edge match priority (base weight)
    score += countMatchingEdges(tile, grid, row, col, columns) * 10;

    if (score > bestScore) {
      bestScore = score;
      bestTileIndex = i;
    }
  }

  return bestTileIndex;
}

// Check if tile mirrors adjacent tiles
function isMirrorMatch(tile: TileData, grid: GridCell[], row: number, col: number, columns: number): boolean {
  const currentPos = row * columns + col;
  const tileEdges = getNESW(tile);
  
  // Check left neighbor for horizontal mirror
  if (col > 0) {
    const leftPos = currentPos - 1;
    const leftTile = grid[leftPos]?.tile;
    if (leftTile && leftTile.mirrorH === tile.id) return true;
  }
  
  // Check top neighbor for vertical mirror
  if (row > 0) {
    const topPos = currentPos - columns;
    const topTile = grid[topPos]?.tile;
    if (topTile && topTile.mirrorV === tile.id) return true;
  }
  
  return false;
}

// Check if tile is a rotation variant of adjacent tiles
function isRotationMatch(tile: TileData, grid: GridCell[], row: number, col: number, columns: number): boolean {
  const currentPos = row * columns + col;
  
  // Check left neighbor
  if (col > 0) {
    const leftPos = currentPos - 1;
    const leftTile = grid[leftPos]?.tile;
    if (leftTile && isRotationFamily(tile, leftTile)) return true;
  }
  
  // Check top neighbor  
  if (row > 0) {
    const topPos = currentPos - columns;
    const topTile = grid[topPos]?.tile;
    if (topTile && isRotationFamily(tile, topTile)) return true;
  }
  
  return false;
}

// Check if two tiles belong to the same rotation family
function isRotationFamily(tile1: TileData, tile2: TileData): boolean {
  const rotations1 = [tile1.rotation0, tile1.rotation90, tile1.rotation180, tile1.rotation270];
  const rotations2 = [tile2.rotation0, tile2.rotation90, tile2.rotation180, tile2.rotation270];
  
  // Check if any rotation of tile1 matches any rotation of tile2
  return rotations1.some(rot1 => rotations2.includes(rot1));
}

// Count how many edges match with adjacent tiles
function countMatchingEdges(tile: TileData, grid: GridCell[], row: number, col: number, columns: number): number {
  const currentPos = row * columns + col;
  const tileEdges = getNESW(tile);
  let matchCount = 0;

  // Check left neighbor (West-East connection)
  if (col > 0) {
    const leftPos = currentPos - 1;
    const leftTile = grid[leftPos]?.tile;
    if (leftTile) {
      const leftEdges = getNESW(leftTile);
      if (leftEdges.E === tileEdges.W) matchCount++;
    }
  }

  // Check top neighbor (North-South connection)
  if (row > 0) {
    const topPos = currentPos - columns;
    const topTile = grid[topPos]?.tile;
    if (topTile) {
      const topEdges = getNESW(topTile);
      if (topEdges.S === tileEdges.N) matchCount++;
    }
  }

  // Check right neighbor (East-West connection)
  if (col < columns - 1) {
    const rightPos = currentPos + 1;
    const rightTile = grid[rightPos]?.tile;
    if (rightTile) {
      const rightEdges = getNESW(rightTile);
      if (rightEdges.W === tileEdges.E) matchCount++;
    }
  }

  // Check bottom neighbor (South-North connection)
  const rows = Math.ceil(grid.length / columns);
  if (row < rows - 1) {
    const bottomPos = currentPos + columns;
    const bottomTile = grid[bottomPos]?.tile;
    if (bottomTile) {
      const bottomEdges = getNESW(bottomTile);
      if (bottomEdges.N === tileEdges.S) matchCount++;
    }
  }

  return matchCount;
}

// Main optimization function - exact replica from old repo
export function optimizeEdgeMatching(grid: GridCell[], allTiles: TileData[], columns: number): GridCell[] {
  console.log('🔄 Starting edge matching optimization...');
  
  const used = new Set<number>();
  const rows = Math.ceil(grid.length / columns);
  
  // Copy grid to avoid mutating original
  const newGrid = [...grid];

  // Iterate through grid positions (left to right, top to bottom)
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const currentPos = row * columns + col;
      if (currentPos >= newGrid.length) break;

      // Find the best tile for this position
      const bestTileIndex = findBestTileForPosition(currentPos, row, col, used, newGrid, allTiles, columns);

      if (bestTileIndex !== null && bestTileIndex !== currentPos) {
        // Swap the best tile to current position
        [newGrid[currentPos], newGrid[bestTileIndex]] = [newGrid[bestTileIndex], newGrid[currentPos]];
      }

      // Mark current position as used
      used.add(currentPos);
    }
  }

  console.log('✅ Edge matching optimization complete');
  return newGrid;
}

// Fill all tiles: 1-1 mapping, no duplicates  
export function fillAllTiles(grid: GridCell[], allTiles: TileData[]): GridCell[] {
  console.log('🎯 Filling grid with all 96 tiles (1-1 mapping)...');
  
  if (allTiles.length !== 96) {
    console.warn('⚠️ Expected 96 tiles, got', allTiles.length);
  }

  const newGrid = [...grid];
  const shuffledTiles = [...allTiles].sort(() => Math.random() - 0.5);
  
  // Fill grid with ALL tiles (exact 1-to-1 mapping)
  for (let i = 0; i < Math.min(shuffledTiles.length, newGrid.length); i++) {
    newGrid[i] = {
      ...newGrid[i],
      tile: shuffledTiles[i]
    };
  }
  
  console.log('✅ Grid filled with ALL tiles:', newGrid.filter(c => c.tile).length, '/ 96');
  return newGrid;
}

// Clear grid - remove all tiles
export function clearGrid(grid: GridCell[]): GridCell[] {
  console.log('🧹 Clearing grid...');
  return grid.map(cell => ({
    ...cell,
    tile: undefined
  }));
}