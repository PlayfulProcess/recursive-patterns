/**
 * Modular scoring functions for tile optimization
 */

import { TileData } from '../../components/CSVTable';
import { ScoringFunction, OptimizationContext } from './optimizationConfig';


// Helper function to get edge colors in NESW order
function getEdgeColors(tile: TileData): string[] {
  return [tile.edgeN, tile.edgeE, tile.edgeS || (tile as any).EdgeS || '', tile.edgeW];
}

// Helper function to calculate Manhattan distance between positions
function getManhattanDistance(pos1: number, pos2: number, columns: number): number {
  const row1 = Math.floor(pos1 / columns);
  const col1 = pos1 % columns;
  const row2 = Math.floor(pos2 / columns);
  const col2 = pos2 % columns;
  return Math.abs(row1 - row2) + Math.abs(col1 - col2);
}

/**
 * Edge Color Matching Score
 * Counts matching edges with already-placed neighbors
 */
export const edgeColorMatching: ScoringFunction = {
  name: 'edgeColorMatching',
  description: 'Scores based on edge color matches with adjacent tiles',
  calculate: (tile: TileData, context: OptimizationContext): number => {
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
};

/**
 * Mirror Relationship Score
 * High score if tile has mirror relationship with neighbors
 */
export const mirrorRelationship: ScoringFunction = {
  name: 'mirrorRelationship',
  description: 'Scores tiles that are mirrors of adjacent tiles',
  calculate: (tile: TileData, context: OptimizationContext): number => {
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
};

/**
 * Shape Clustering Score
 * Bonus for tiles that share shape with nearby tiles
 */
export const shapeClustering: ScoringFunction = {
  name: 'shapeClustering',
  description: 'Promotes clustering of tiles with the same shape',
  calculate: (tile: TileData, context: OptimizationContext): number => {
    const { grid, columns, position, row, col } = context;
    let shapeMatches = 0;
    
    // Check all adjacent positions (including diagonals for clustering)
    const adjacentOffsets = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];
    
    adjacentOffsets.forEach(([rowOffset, colOffset]) => {
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
};

/**
 * Color-Specific Edge Matching
 * Only counts matches for specific color
 */
export function createColorSpecificMatching(targetColor: string): ScoringFunction {
  return {
    name: `colorMatching_${targetColor}`,
    description: `Scores edge matches only for color ${targetColor}`,
    calculate: (tile: TileData, context: OptimizationContext): number => {
      const { grid, columns, position, row, col } = context;
      let colorMatches = 0;
      
      // Check left neighbor
      if (col > 0) {
        const leftPos = position - 1;
        const leftTile = grid[leftPos]?.tile;
        if (leftTile && leftTile.edgeE === targetColor && tile.edgeW === targetColor) {
          colorMatches++;
        }
      }
      
      // Check top neighbor
      if (row > 0) {
        const topPos = position - columns;
        const topTile = grid[topPos]?.tile;
        const tileEdgeS = tile.edgeS || (tile as any).EdgeS || '';
        if (topTile) {
          const topEdgeS = topTile.edgeS || (topTile as any).EdgeS || '';
          if (topEdgeS === targetColor && tile.edgeN === targetColor) {
            colorMatches++;
          }
        }
      }
      
      return colorMatches;
    }
  };
}

/**
 * Distance Penalty Score
 * Penalizes swaps that move tiles far from their current position
 */
export const distancePenalty: ScoringFunction = {
  name: 'distancePenalty',
  description: 'Penalty for long-distance tile swaps',
  calculate: (tile: TileData, context: OptimizationContext): number => {
    const { grid, position } = context;
    
    // Find current position of this tile in grid
    let currentPos = -1;
    for (let i = 0; i < grid.length; i++) {
      if (grid[i].tile?.id === tile.id) {
        currentPos = i;
        break;
      }
    }
    
    if (currentPos === -1) return 0;
    
    const distance = getManhattanDistance(currentPos, position, context.columns);
    return -distance; // Negative score (penalty)
  }
};

/**
 * Rotation Family Preference
 * Bonus for tiles that are rotations of nearby tiles
 */
export const rotationFamily: ScoringFunction = {
  name: 'rotationFamily',
  description: 'Promotes tiles that are rotations of nearby tiles',
  calculate: (tile: TileData, context: OptimizationContext): number => {
    const { grid, columns, position, row, col } = context;
    
    // Get rotation family IDs for this tile
    const rotationIds = [
      tile.rotation0,
      tile.rotation90,
      tile.rotation180,
      tile.rotation270
    ].filter(id => id && id !== tile.id);
    
    let rotationMatches = 0;
    
    // Check adjacent positions for rotation family members
    const adjacentOffsets = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    adjacentOffsets.forEach(([rowOffset, colOffset]) => {
      const adjRow = row + rowOffset;
      const adjCol = col + colOffset;
      
      if (adjRow >= 0 && adjRow < context.rows && adjCol >= 0 && adjCol < columns) {
        const adjPos = adjRow * columns + adjCol;
        const adjTile = grid[adjPos]?.tile;
        
        if (adjTile && rotationIds.includes(adjTile.id)) {
          rotationMatches++;
        }
      }
    });
    
    return rotationMatches;
  }
};

/**
 * Color Balance Score
 * Promotes even distribution of colors across the grid
 */
export const colorBalance: ScoringFunction = {
  name: 'colorBalance',
  description: 'Promotes balanced color distribution',
  calculate: (tile: TileData, context: OptimizationContext): number => {
    // This is a simplified version - full implementation would track
    // color distribution and favor underrepresented colors
    const colors = getEdgeColors(tile);
    const uniqueColors = new Set(colors).size;
    return uniqueColors; // Favor tiles with more color variety
  }
};

// Export all default scoring functions
export const DEFAULT_SCORING_FUNCTIONS: ScoringFunction[] = [
  edgeColorMatching,
  mirrorRelationship,
  shapeClustering,
  distancePenalty,
  rotationFamily,
  colorBalance
];

// Export preset function collections
export const SCORING_PRESETS: Record<string, ScoringFunction[]> = {
  classic: [edgeColorMatching, mirrorRelationship],
  comprehensive: DEFAULT_SCORING_FUNCTIONS,
  edgeFocused: [edgeColorMatching, colorBalance],
  shapeFocused: [shapeClustering, rotationFamily, edgeColorMatching],
  mirrorFocused: [mirrorRelationship, edgeColorMatching, distancePenalty]
};