/**
 * PATTERN CREATION MODULE
 * Implements recursive pattern functions as defined in CLAUDE.md
 */

import { TileData } from '@/components/CSVTable';
import { getRotationFamily, buildTileMaps } from '@/lib/dataPrep';

export interface GridCell {
  x: number;
  y: number;
  tile?: TileData;
}

export type Direction = 'N' | 'E' | 'S' | 'W';
export type TransformType = 'rotation0' | 'rotation90' | 'rotation180' | 'rotation270' | 'mirrorH' | 'mirrorV';

// 1. Get all variations of rotations and mirrors
export function getAllVariations(baseTile: TileData, allTiles: TileData[]): {
  rotations: TileData[];
  mirrors: { mirrorH?: TileData; mirrorV?: TileData };
  family: TileData[];
} {
  const { byId } = buildTileMaps(allTiles);
  
  // Get rotation family
  const rotations = getRotationFamily(baseTile, allTiles);
  
  // Get mirrors
  const mirrorH = byId.get(baseTile.mirrorH);
  const mirrorV = byId.get(baseTile.mirrorV);
  
  // Combine all variations
  const family = [...rotations];
  if (mirrorH && !family.find(t => t.id === mirrorH.id)) family.push(mirrorH);
  if (mirrorV && !family.find(t => t.id === mirrorV.id)) family.push(mirrorV);
  
  return {
    rotations,
    mirrors: { mirrorH, mirrorV },
    family
  };
}

// 2. Place tile in specific direction (S, W, E, N)
export function placeTileInDirection(
  grid: GridCell[],
  sourceCell: GridCell,
  direction: Direction,
  targetTile: TileData,
  columns: number
): GridCell[] | null {
  const rows = Math.ceil(grid.length / columns);
  const sourceIndex = sourceCell.y * columns + sourceCell.x;
  
  let targetX = sourceCell.x;
  let targetY = sourceCell.y;
  
  // Calculate target position based on direction
  switch (direction) {
    case 'N': targetY -= 1; break; // North (up)
    case 'E': targetX += 1; break; // East (right)  
    case 'S': targetY += 1; break; // South (down)
    case 'W': targetX -= 1; break; // West (left)
  }
  
  // Check bounds
  if (targetX < 0 || targetX >= columns || targetY < 0 || targetY >= rows) {
    console.log('❌ Target position out of bounds:', { targetX, targetY });
    return null;
  }
  
  const targetIndex = targetY * columns + targetX;
  if (targetIndex >= grid.length) {
    console.log('❌ Target index out of bounds:', targetIndex);
    return null;
  }
  
  // Check if target position is empty
  if (grid[targetIndex].tile) {
    console.log('❌ Target position already occupied');
    return null;
  }
  
  // Place the tile
  const newGrid = [...grid];
  newGrid[targetIndex] = {
    ...newGrid[targetIndex],
    tile: targetTile
  };
  
  console.log(`✅ Placed tile ${targetTile.id} ${direction} of ${sourceCell.tile?.id || 'source'}`);
  return newGrid;
}

// 3. Iteration functions
export function applyToSelectedCell(
  grid: GridCell[],
  selectedCell: GridCell,
  transform: TransformType,
  allTiles: TileData[]
): GridCell[] | null {
  if (!selectedCell.tile) return null;
  
  const { byId } = buildTileMaps(allTiles);
  let newTile: TileData | undefined;
  
  // Get the transformed tile
  switch (transform) {
    case 'rotation0': newTile = byId.get(selectedCell.tile.rotation0); break;
    case 'rotation90': newTile = byId.get(selectedCell.tile.rotation90); break;
    case 'rotation180': newTile = byId.get(selectedCell.tile.rotation180); break;
    case 'rotation270': newTile = byId.get(selectedCell.tile.rotation270); break;
    case 'mirrorH': newTile = byId.get(selectedCell.tile.mirrorH); break;
    case 'mirrorV': newTile = byId.get(selectedCell.tile.mirrorV); break;
  }
  
  if (!newTile) {
    console.log(`❌ Transform ${transform} not available for tile ${selectedCell.tile.id}`);
    return null;
  }
  
  const newGrid = [...grid];
  const cellIndex = selectedCell.y * 12 + selectedCell.x; // Assuming 12 columns
  newGrid[cellIndex] = {
    ...newGrid[cellIndex],
    tile: newTile
  };
  
  console.log(`✅ Applied ${transform} to cell (${selectedCell.x}, ${selectedCell.y}): ${selectedCell.tile.id} → ${newTile.id}`);
  return newGrid;
}

export function applyAcrossGrid(
  grid: GridCell[],
  transform: TransformType,
  direction: Direction,
  allTiles: TileData[],
  columns: number,
  maxIterations: number = 95
): GridCell[] {
  console.log(`🔄 Applying ${transform} across grid in ${direction} direction...`);
  
  const { byId } = buildTileMaps(allTiles);
  const newGrid = [...grid];
  const rows = Math.ceil(grid.length / columns);
  const processed = new Set<number>();
  let iterations = 0;
  
  // Iterate through grid in specified direction
  for (let row = 0; row < rows && iterations < maxIterations; row++) {
    for (let col = 0; col < columns && iterations < maxIterations; col++) {
      const currentIndex = row * columns + col;
      
      if (processed.has(currentIndex) || !newGrid[currentIndex]?.tile) {
        continue;
      }
      
      const currentTile = newGrid[currentIndex].tile!;
      let transformedTile: TileData | undefined;
      
      // Get transformed tile
      switch (transform) {
        case 'rotation0': transformedTile = byId.get(currentTile.rotation0); break;
        case 'rotation90': transformedTile = byId.get(currentTile.rotation90); break;
        case 'rotation180': transformedTile = byId.get(currentTile.rotation180); break;
        case 'rotation270': transformedTile = byId.get(currentTile.rotation270); break;
        case 'mirrorH': transformedTile = byId.get(currentTile.mirrorH); break;
        case 'mirrorV': transformedTile = byId.get(currentTile.mirrorV); break;
      }
      
      if (!transformedTile) continue;
      
      // Calculate target position based on direction
      let targetRow = row;
      let targetCol = col;
      
      switch (direction) {
        case 'N': targetRow -= 1; break;
        case 'E': targetCol += 1; break;
        case 'S': targetRow += 1; break;
        case 'W': targetCol -= 1; break;
      }
      
      // Check bounds and availability
      if (targetRow >= 0 && targetRow < rows && targetCol >= 0 && targetCol < columns) {
        const targetIndex = targetRow * columns + targetCol;
        
        if (targetIndex < newGrid.length && !newGrid[targetIndex].tile && !processed.has(targetIndex)) {
          // Place the transformed tile
          newGrid[targetIndex] = {
            ...newGrid[targetIndex],
            tile: transformedTile
          };
          
          processed.add(currentIndex);
          processed.add(targetIndex);
          iterations++;
          
          console.log(`  ${iterations}: ${currentTile.id} → ${transformedTile.id} at (${targetCol}, ${targetRow})`);
        }
      }
    }
  }
  
  console.log(`✅ Applied ${iterations} transformations (max: ${maxIterations})`);
  return newGrid;
}

// 4. Preset function - Edge Matching (using the optimized function from edgeMatching.ts)
export function createEdgeMatchingPattern(
  grid: GridCell[],
  allTiles: TileData[],
  columns: number
): GridCell[] {
  console.log('🎯 Creating edge matching pattern...');
  
  // Import the function dynamically to avoid circular dependencies
  const { optimizeEdgeMatching } = require('@/lib/edgeMatching');
  return optimizeEdgeMatching(grid, allTiles, columns);
}

// Helper: Get tile by ID
export function getTileById(tileId: string, allTiles: TileData[]): TileData | undefined {
  return allTiles.find(t => t.id === tileId);
}

// Helper: Check if position is valid
export function isValidPosition(x: number, y: number, columns: number, rows: number): boolean {
  return x >= 0 && x < columns && y >= 0 && y < rows;
}

// Helper: Get neighboring cells
export function getNeighbors(cell: GridCell, grid: GridCell[], columns: number): {
  north?: GridCell;
  east?: GridCell; 
  south?: GridCell;
  west?: GridCell;
} {
  const rows = Math.ceil(grid.length / columns);
  const neighbors: any = {};
  
  // North
  if (cell.y > 0) {
    const northIndex = (cell.y - 1) * columns + cell.x;
    neighbors.north = grid[northIndex];
  }
  
  // East  
  if (cell.x < columns - 1) {
    const eastIndex = cell.y * columns + (cell.x + 1);
    neighbors.east = grid[eastIndex];
  }
  
  // South
  if (cell.y < rows - 1) {
    const southIndex = (cell.y + 1) * columns + cell.x;
    neighbors.south = grid[southIndex];
  }
  
  // West
  if (cell.x > 0) {
    const westIndex = cell.y * columns + (cell.x - 1);
    neighbors.west = grid[westIndex];
  }
  
  return neighbors;
}