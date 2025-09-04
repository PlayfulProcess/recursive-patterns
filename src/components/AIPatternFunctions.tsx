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
  TileRelationships,
  calculatePatternScore,
  findAllMirrorPairs,
  iterativeImprove
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

  // AI FUNCTION 6: Optimize Mirror Placement
  public async optimizeMirrorPlacement(args: { 
    direction?: 'horizontal' | 'vertical' | 'both';
    iterations?: number 
  } = {}): Promise<FunctionResult> {
    try {
      const { direction = 'both', iterations = 5 } = args;
      
      // Score function that prioritizes mirror proximity and correct orientation
      const scoreFn = (grid: GridCell[]) => {
        const score = calculatePatternScore(grid, this.tileRelationships);
        return score.mirrorScore; // Uses enhanced mirror scoring with orientation bonuses
      };
      
      const optimizedGrid = iterativeImprove(this.grid, scoreFn, iterations);
      const mirrorPairs = findAllMirrorPairs(optimizedGrid, this.tileRelationships);
      
      // Count correctly oriented pairs
      const horizontalPairs = mirrorPairs.filter(p => p.direction === 'horizontal').length;
      const verticalPairs = mirrorPairs.filter(p => p.direction === 'vertical').length;
      
      this.grid = optimizedGrid;
      this.onGridUpdate(optimizedGrid);
      
      return {
        success: true,
        message: `Optimized mirror placement (${direction}). Found ${mirrorPairs.length} mirror pairs: ${horizontalPairs} horizontal, ${verticalPairs} vertical. Horizontal mirrors placed horizontally, vertical mirrors placed vertically.`,
        gridState: optimizedGrid
      };
    } catch (error) {
      return {
        success: false,
        message: `Error optimizing mirror placement: ${error}`
      };
    }
  }

  // AI FUNCTION 7: Balance Color Distribution
  public async balanceColorDistribution(args: { 
    targetBalance?: 'even' | 'gradient' | 'clustered' 
  } = {}): Promise<FunctionResult> {
    try {
      const { targetBalance = 'even' } = args;
      
      // Score function that prioritizes color balance
      const scoreFn = (grid: GridCell[]) => {
        const score = calculatePatternScore(grid, this.tileRelationships);
        return score.colorBalance; // Focus on color balance
      };
      
      const optimizedGrid = iterativeImprove(this.grid, scoreFn, 8);
      const finalScore = calculatePatternScore(optimizedGrid, this.tileRelationships);
      
      this.grid = optimizedGrid;
      this.onGridUpdate(optimizedGrid);
      
      return {
        success: true,
        message: `Balanced color distribution (${targetBalance}). Color balance score: ${(finalScore.colorBalance * 100).toFixed(1)}%`,
        gridState: optimizedGrid
      };
    } catch (error) {
      return {
        success: false,
        message: `Error balancing colors: ${error}`
      };
    }
  }

  // AI FUNCTION 8: Analyze Pattern Quality
  public async analyzePatternQuality(): Promise<FunctionResult> {
    try {
      const score = calculatePatternScore(this.grid, this.tileRelationships);
      const mirrorPairs = findAllMirrorPairs(this.grid, this.tileRelationships);
      
      const analysis = `
**Pattern Analysis:**
• Edge Matching: ${(score.edgeScore * 100).toFixed(1)}%
• Mirror Proximity: ${score.mirrorScore} points (${mirrorPairs.length} pairs)
• Color Balance: ${(score.colorBalance * 100).toFixed(1)}%
• Flow Continuity: ${score.flowScore} connections
• **Overall Score: ${(score.totalScore * 100).toFixed(1)}%**

**Recommendations:**
${score.edgeScore < 0.5 ? '- Run edge matching optimization\n' : ''}${score.mirrorScore < 10 ? '- Optimize mirror placement\n' : ''}${score.colorBalance < 0.8 ? '- Balance color distribution\n' : ''}${score.totalScore > 0.7 ? '✅ Pattern looks great!' : '🔧 Pattern could be improved'}`;

      return {
        success: true,
        message: analysis,
        gridState: this.grid
      };
    } catch (error) {
      return {
        success: false,
        message: `Error analyzing pattern: ${error}`
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
      case 'optimizeMirrorPlacement':
        return this.optimizeMirrorPlacement(args);
      case 'balanceColorDistribution':
        return this.balanceColorDistribution(args);
      case 'analyzePatternQuality':
        return this.analyzePatternQuality();
      default:
        return {
          success: false,
          message: `Unknown function: ${functionName}. Available: fillGrid, optimizeEdgeMatching, findMirrorTile, findRotationFamily, findEdgeMatches, optimizeMirrorPlacement, balanceColorDistribution, analyzePatternQuality`
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
        name: 'optimizeMirrorPlacement',
        description: 'Iteratively arrange tiles to maximize mirror pairs proximity (direction: horizontal/vertical/both, iterations: number)'
      },
      {
        name: 'balanceColorDistribution',
        description: 'Balance edge color distribution across grid for visual harmony (targetBalance: even/gradient/clustered)'
      },
      {
        name: 'analyzePatternQuality',
        description: 'Analyze current pattern quality and provide improvement recommendations'
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