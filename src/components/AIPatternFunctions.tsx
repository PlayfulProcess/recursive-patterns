/**
 * AI PATTERN FUNCTIONS - Clean AI Interface
 * Only essential functions that AI can call
 */

import { TileData } from './CSVTable';
import { 
  fillGrid, 
  optimizeEdgeMatching, 
  GridCell, 
  buildTileRelationships,
  findMirrorTile,
  findRotationFamily, 
  findEdgeMatches,
  TileRelationships
} from './CoreFunctions';

export interface FunctionResult {
  success: boolean;
  message: string;
  gridState?: GridCell[];
}

export class AIPatternFunctions {
  private tileRelationships: TileRelationships;

  constructor(
    private grid: GridCell[],
    private allTiles: TileData[],
    private onGridUpdate: (newGrid: GridCell[]) => void,
    private gridWidth: number = 12,
    private gridHeight: number = 8
  ) {
    // Build tile relationships once on initialization
    this.tileRelationships = buildTileRelationships(allTiles);
  }

  // Update grid when external changes occur
  public updateGrid(newGrid: GridCell[]): void {
    this.grid = newGrid;
  }

  // AI FUNCTION 1: Fill Grid with all tiles
  public async fillGrid(): Promise<FunctionResult> {
    try {
      const newGrid = fillGrid(this.grid, this.allTiles);
      this.grid = newGrid;
      this.onGridUpdate(newGrid);
      
      const filledCount = newGrid.filter(c => c.tile).length;
      return {
        success: true,
        message: `Filled grid with ${filledCount} tiles (all unique)`,
        gridState: newGrid
      };
    } catch (error) {
      return {
        success: false,
        message: `Error in fillGrid: ${error}`
      };
    }
  }

  // AI FUNCTION 2: Optimize Edge Matching
  public async optimizeEdgeMatching(): Promise<FunctionResult> {
    try {
      const newGrid = optimizeEdgeMatching(this.grid, this.gridWidth, this.gridHeight);
      this.grid = newGrid;
      this.onGridUpdate(newGrid);
      
      return {
        success: true,
        message: 'Edge matching optimization complete - tiles connected by color',
        gridState: newGrid
      };
    } catch (error) {
      return {
        success: false,
        message: `Error in edge matching: ${error}`
      };
    }
  }

  // AI FUNCTION 3: Find Mirror Tile
  public async findMirrorTile(args: { position: number; direction: 'horizontal' | 'vertical'; place?: boolean }): Promise<FunctionResult> {
    try {
      const { position, direction, place = false } = args;
      
      if (position < 0 || position >= this.grid.length) {
        return { success: false, message: `Invalid position: ${position}` };
      }

      const currentTile = this.grid[position].tile;
      if (!currentTile) {
        return { success: false, message: `No tile at position ${position}` };
      }

      const mirrorTile = findMirrorTile(currentTile, direction, this.tileRelationships);
      if (!mirrorTile) {
        return { success: false, message: `No ${direction} mirror found for tile ${currentTile.id}` };
      }

      let message = `Found ${direction} mirror: ${currentTile.id} -> ${mirrorTile.id}`;
      
      // Optionally place the mirror tile in adjacent position
      if (place) {
        const targetPos = this.calculateMirrorPosition(position, direction);
        if (targetPos >= 0 && targetPos < this.grid.length && !this.grid[targetPos].tile) {
          const newGrid = [...this.grid];
          newGrid[targetPos] = { ...newGrid[targetPos], tile: mirrorTile, rotation: 0 };
          this.grid = newGrid;
          this.onGridUpdate(newGrid);
          message += ` and placed at position ${targetPos}`;
        }
      }

      return {
        success: true,
        message,
        gridState: this.grid
      };
    } catch (error) {
      return {
        success: false,
        message: `Error finding mirror tile: ${error}`
      };
    }
  }

  // AI FUNCTION 4: Find Rotation Family
  public async findRotationFamily(args: { position: number }): Promise<FunctionResult> {
    try {
      const { position } = args;
      
      if (position < 0 || position >= this.grid.length) {
        return { success: false, message: `Invalid position: ${position}` };
      }

      const currentTile = this.grid[position].tile;
      if (!currentTile) {
        return { success: false, message: `No tile at position ${position}` };
      }

      const rotationVariants = findRotationFamily(currentTile, this.tileRelationships);
      
      return {
        success: true,
        message: `Found ${rotationVariants.length} rotation variants for shape ${currentTile.shape}: ${rotationVariants.map(t => t.id).join(', ')}`,
        gridState: this.grid
      };
    } catch (error) {
      return {
        success: false,
        message: `Error finding rotation family: ${error}`
      };
    }
  }

  // AI FUNCTION 5: Find Edge Matches
  public async findEdgeMatches(args: { position: number; direction: 'north' | 'south' | 'east' | 'west' }): Promise<FunctionResult> {
    try {
      const { position, direction } = args;
      
      if (position < 0 || position >= this.grid.length) {
        return { success: false, message: `Invalid position: ${position}` };
      }

      const currentTile = this.grid[position].tile;
      if (!currentTile) {
        return { success: false, message: `No tile at position ${position}` };
      }

      const edgeMatches = findEdgeMatches(currentTile, direction, this.tileRelationships);
      
      return {
        success: true,
        message: `Found ${edgeMatches.length} edge matches for ${direction} direction: ${edgeMatches.slice(0, 5).map(t => t.id).join(', ')}${edgeMatches.length > 5 ? '...' : ''}`,
        gridState: this.grid
      };
    } catch (error) {
      return {
        success: false,
        message: `Error finding edge matches: ${error}`
      };
    }
  }

  // Execute function by name (for AI calls)
  public async executeFunction(functionName: string, args: any = {}): Promise<FunctionResult> {
    console.log(`🤖 AI calling function: ${functionName}`);
    
    switch(functionName) {
      case 'fillGrid':
        return this.fillGrid();
      case 'optimizeEdgeMatching':
        return this.optimizeEdgeMatching();
      case 'findMirrorTile':
        return this.findMirrorTile(args);
      case 'findRotationFamily':
        return this.findRotationFamily(args);
      case 'findEdgeMatches':
        return this.findEdgeMatches(args);
      default:
        return {
          success: false,
          message: `Unknown function: ${functionName}. Available: fillGrid, optimizeEdgeMatching, findMirrorTile, findRotationFamily, findEdgeMatches`
        };
    }
  }

  // Helper function to calculate mirror position
  private calculateMirrorPosition(position: number, direction: 'horizontal' | 'vertical'): number {
    const row = Math.floor(position / this.gridWidth);
    const col = position % this.gridWidth;
    
    if (direction === 'horizontal') {
      // Place horizontally adjacent (to the right if possible)
      return col < this.gridWidth - 1 ? position + 1 : position - 1;
    } else {
      // Place vertically adjacent (below if possible)
      return row < this.gridHeight - 1 ? position + this.gridWidth : position - this.gridWidth;
    }
  }

  // Get list of available functions for AI
  public getAvailableFunctions(): Array<{name: string, description: string}> {
    return [
      {
        name: 'fillGrid',
        description: 'Fill grid with all 96 tiles, each used exactly once'
      },
      {
        name: 'optimizeEdgeMatching', 
        description: 'Optimize tile placement for beautiful edge patterns using reference algorithm'
      },
      {
        name: 'findMirrorTile',
        description: 'Find mirror tile for tile at position in specified direction (horizontal/vertical)'
      },
      {
        name: 'findRotationFamily',
        description: 'Find all rotation variants of tile at position (same shape family)'
      },
      {
        name: 'findEdgeMatches',
        description: 'Find tiles with matching edge colors for seamless connections'
      }
    ];
  }
}