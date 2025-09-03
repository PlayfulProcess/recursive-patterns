/**
 * AI PATTERN FUNCTIONS - Minimal Wrapper
 * Simplified to only essential functions
 * Rebuilding from scratch as per CLAUDE.md
 */

import { TileData } from './CSVTable';
import { fillGrid, optimizeEdgeMatching, GridCell, FunctionResult } from './CoreFunctions';

export class AIPatternFunctions {
  constructor(
    private grid: GridCell[],
    private allTiles: TileData[],
    private onGridUpdate: (newGrid: GridCell[]) => void,
    private gridWidth: number = 12,
    private gridHeight: number = 8
  ) {}

  // Update grid when external changes occur
  public updateGrid(newGrid: GridCell[]): void {
    this.grid = newGrid;
  }

  // FUNCTION 1: Fill Grid with all tiles
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

  // FUNCTION 2: Optimize Edge Matching
  public async optimizeEdgeMatching(): Promise<FunctionResult> {
    try {
      const newGrid = optimizeEdgeMatching(this.grid);
      this.grid = newGrid;
      this.onGridUpdate(newGrid);
      
      return {
        success: true,
        message: 'Edge matching optimization complete',
        gridState: newGrid
      };
    } catch (error) {
      return {
        success: false,
        message: `Error in edge matching: ${error}`
      };
    }
  }

  // Execute function by name (for AI calls)
  public async executeFunction(functionName: string, args: any = {}): Promise<FunctionResult> {
    console.log(`Executing: ${functionName}`);
    
    switch(functionName) {
      case 'fillGrid':
        return this.fillGrid();
      case 'optimizeEdgeMatching':
        return this.optimizeEdgeMatching();
      default:
        return {
          success: false,
          message: `Unknown function: ${functionName}`
        };
    }
  }

  // Get list of available functions
  public getAvailableFunctions(): Array<{name: string, description: string}> {
    return [
      {
        name: 'fillGrid',
        description: 'Fill grid with all 96 tiles, each used exactly once'
      },
      {
        name: 'optimizeEdgeMatching', 
        description: 'Optimize tile placement for beautiful edge patterns'
      }
    ];
  }
}