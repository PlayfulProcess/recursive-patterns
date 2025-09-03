/**
 * AI PATTERN FUNCTIONS - Clean AI Interface
 * Only essential functions that AI can call
 */

import { TileData } from './CSVTable';
import { fillGrid, optimizeEdgeMatching, GridCell } from './CoreFunctions';

export interface FunctionResult {
  success: boolean;
  message: string;
  gridState?: GridCell[];
}

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

  // Execute function by name (for AI calls)
  public async executeFunction(functionName: string, args: any = {}): Promise<FunctionResult> {
    console.log(`🤖 AI calling function: ${functionName}`);
    
    switch(functionName) {
      case 'fillGrid':
        return this.fillGrid();
      case 'optimizeEdgeMatching':
        return this.optimizeEdgeMatching();
      default:
        return {
          success: false,
          message: `Unknown function: ${functionName}. Available: fillGrid, optimizeEdgeMatching`
        };
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
      }
    ];
  }
}