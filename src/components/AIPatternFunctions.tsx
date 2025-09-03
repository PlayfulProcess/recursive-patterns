// AI Pattern Functions - Interface for AI to call Beautiful Edge Matching algorithms
import { BeautifulEdgeMatching } from './BeautifulEdgeMatching';
import { TileData } from './CSVTable';

interface GridCell {
  x: number;
  y: number;
  tile?: TileData;
  rotation?: number;
}

interface PatternFunctionResult {
  success: boolean;
  message: string;
  gridState?: GridCell[];
  debugInfo?: any;
}

export class AIPatternFunctions {
  private edgeMatching: BeautifulEdgeMatching | null = null;

  constructor(
    private grid: GridCell[],
    private allTiles: TileData[],
    private onGridUpdate: (newGrid: GridCell[]) => void,
    private gridWidth: number = 12,
    private gridHeight: number = 8
  ) {
    this.initializeEdgeMatching();
  }

  private initializeEdgeMatching(): void {
    this.edgeMatching = new BeautifulEdgeMatching(
      this.grid,
      this.allTiles,
      this.onGridUpdate,
      this.gridWidth,
      this.gridHeight
    );
  }

  // Update grid state when external changes occur
  public updateGrid(newGrid: GridCell[]): void {
    this.grid = newGrid;
    this.initializeEdgeMatching();
  }

  // 1. OPTIMIZE EDGE MATCHING - AI callable
  public async optimizeEdgeMatching(): Promise<PatternFunctionResult> {
    if (!this.edgeMatching) {
      return { success: false, message: 'Edge matching not initialized' };
    }

    try {
      const result = this.edgeMatching.optimizeEdgeMatching();
      return {
        success: true,
        message: result,
        gridState: [...this.grid]
      };
    } catch (error) {
      return {
        success: false,
        message: `Error in edge optimization: ${error}`
      };
    }
  }

  // 2. BUILD LATERAL EDGES - AI callable
  public async buildLateralEdges(): Promise<PatternFunctionResult> {
    if (!this.edgeMatching) {
      return { success: false, message: 'Edge matching not initialized' };
    }

    try {
      const result = this.edgeMatching.buildLateralEdges();
      return {
        success: true,
        message: result,
        gridState: [...this.grid]
      };
    } catch (error) {
      return {
        success: false,
        message: `Error in lateral edge building: ${error}`
      };
    }
  }

  // 3. BUILD VERTICAL EDGES - AI callable  
  public async buildBottomEdges(): Promise<PatternFunctionResult> {
    if (!this.edgeMatching) {
      return { success: false, message: 'Edge matching not initialized' };
    }

    try {
      const result = this.edgeMatching.buildBottomEdges();
      return {
        success: true,
        message: result,
        gridState: [...this.grid]
      };
    } catch (error) {
      return {
        success: false,
        message: `Error in vertical edge building: ${error}`
      };
    }
  }

  // 4. COMPLETE BEAUTIFUL PATTERN - AI callable
  public async createBeautifulPattern(): Promise<PatternFunctionResult> {
    if (!this.edgeMatching) {
      return { success: false, message: 'Edge matching not initialized' };
    }

    try {
      const result = this.edgeMatching.createBeautifulPattern();
      return {
        success: true,
        message: result,
        gridState: [...this.grid]
      };
    } catch (error) {
      return {
        success: false,
        message: `Error in beautiful pattern creation: ${error}`
      };
    }
  }

  // 5. DEBUG SIGNATURES - AI callable
  public async logEdgeSignatures(): Promise<PatternFunctionResult> {
    if (!this.edgeMatching) {
      return { success: false, message: 'Edge matching not initialized' };
    }

    try {
      const result = this.edgeMatching.logEdgeSignatures();
      const debugInfo = this.edgeMatching.getDebugSignatures();
      
      return {
        success: true,
        message: result,
        gridState: [...this.grid],
        debugInfo: debugInfo
      };
    } catch (error) {
      return {
        success: false,
        message: `Error in signature logging: ${error}`
      };
    }
  }

  // 6. AI CUSTOM COMBINATIONS - Examples of what AI can create
  public async customLateralFocus(): Promise<PatternFunctionResult> {
    try {
      // AI-designed: Optimize first, then double lateral building
      const step1 = await this.optimizeEdgeMatching();
      const step2 = await this.buildLateralEdges();
      const step3 = await this.buildLateralEdges(); // Run again for stronger chains
      
      return {
        success: true,
        message: `Custom lateral focus complete! ${step1.message} Then ran lateral building twice for stronger horizontal flow.`,
        gridState: [...this.grid]
      };
    } catch (error) {
      return {
        success: false,
        message: `Error in custom lateral focus: ${error}`
      };
    }
  }

  public async customVerticalFocus(): Promise<PatternFunctionResult> {
    try {
      // AI-designed: Skip edge optimization, focus on vertical chains
      const step1 = await this.buildBottomEdges();
      const step2 = await this.buildBottomEdges(); // Run again for stronger chains
      
      return {
        success: true,
        message: `Custom vertical focus complete! Built strong vertical chains without initial optimization.`,
        gridState: [...this.grid]
      };
    } catch (error) {
      return {
        success: false,
        message: `Error in custom vertical focus: ${error}`
      };
    }
  }

  // 7. EXECUTE FUNCTION BY NAME - Called by AI chat
  public async executeFunction(functionName: string, args: any = {}): Promise<PatternFunctionResult> {
    console.log(`🤖 AI calling function: ${functionName}`, args);
    console.log(`🎯 Grid has ${this.grid.filter(c => c.tile).length} tiles`);
    
    switch(functionName) {
      // Edge Matching Functions
      case 'optimizeEdgeMatching':
        return this.optimizeEdgeMatching();
      case 'buildLateralEdges':
        return this.buildLateralEdges();
      case 'buildBottomEdges':
        return this.buildBottomEdges();
      case 'createBeautifulPattern':
        return this.createBeautifulPattern();
      case 'logEdgeSignatures':
        return this.logEdgeSignatures();
      case 'customLateralFocus':
        return this.customLateralFocus();
      case 'customVerticalFocus':
        return this.customVerticalFocus();

      // Organization Functions
      case 'fillGrid':
        return this.fillGrid();
      case 'shuffleGrid':
        return this.shuffleGrid();
      case 'clearGrid':
        return this.clearGrid();
      case 'rotateAllTiles':
        return this.rotateAllTiles();

      // Analysis Functions
      case 'findDuplicates':
        return this.findDuplicates();
      case 'analyzeConnections':
        return this.analyzeConnections();
      case 'removeDuplicates':
        return this.removeDuplicates();

      // Utility Functions
      case 'pairRotationFamilies':
        return this.pairRotationFamilies();
      case 'pairMirrorFamilies':
        return this.pairMirrorFamilies();

      default:
        return {
          success: false,
          message: `Unknown function: ${functionName}`
        };
    }
  }

  // NEW ORGANIZATION FUNCTIONS
  public async fillGrid(): Promise<PatternFunctionResult> {
    if (this.allTiles.length === 0) {
      return { success: false, message: 'No tiles available to fill grid' };
    }

    const newGrid = [...this.grid];
    const shuffledTiles = [...this.allTiles].sort(() => Math.random() - 0.5);
    let tileIndex = 0;

    for (let i = 0; i < newGrid.length && tileIndex < shuffledTiles.length; i++) {
      newGrid[i] = {
        ...newGrid[i],
        tile: shuffledTiles[tileIndex],
        rotation: Math.floor(Math.random() * 4) * 90
      };
      tileIndex++;
    }

    this.grid = newGrid;
    this.onGridUpdate([...this.grid]);
    return { 
      success: true, 
      message: `Grid filled with ${Math.min(newGrid.length, shuffledTiles.length)} diverse tiles`,
      gridState: [...this.grid]
    };
  }

  public async shuffleGrid(): Promise<PatternFunctionResult> {
    const tilesWithPositions = this.grid
      .map((cell, index) => ({ cell, index }))
      .filter(item => item.cell.tile);

    const shuffledTiles = tilesWithPositions
      .map(item => ({ tile: item.cell.tile, rotation: Math.floor(Math.random() * 4) * 90 }))
      .sort(() => Math.random() - 0.5);

    tilesWithPositions.forEach((item, i) => {
      if (shuffledTiles[i]) {
        this.grid[item.index] = {
          ...this.grid[item.index],
          tile: shuffledTiles[i].tile,
          rotation: shuffledTiles[i].rotation
        };
      }
    });

    this.onGridUpdate([...this.grid]);
    return { 
      success: true, 
      message: `Shuffled ${tilesWithPositions.length} tiles with new rotations`,
      gridState: [...this.grid]
    };
  }

  public async clearGrid(): Promise<PatternFunctionResult> {
    this.grid = this.grid.map(cell => ({ x: cell.x, y: cell.y }));
    this.onGridUpdate([...this.grid]);
    return { 
      success: true, 
      message: 'Grid cleared - all tiles removed',
      gridState: [...this.grid]
    };
  }

  public async rotateAllTiles(): Promise<PatternFunctionResult> {
    this.grid = this.grid.map(cell => 
      cell.tile 
        ? { ...cell, rotation: Math.floor(Math.random() * 4) * 90 }
        : cell
    );
    this.onGridUpdate([...this.grid]);
    const rotatedCount = this.grid.filter(cell => cell.tile).length;
    return { 
      success: true, 
      message: `Applied random rotations to ${rotatedCount} tiles`,
      gridState: [...this.grid]
    };
  }

  // NEW ANALYSIS FUNCTIONS
  public async findDuplicates(): Promise<PatternFunctionResult> {
    const tileMap = new Map<string, number[]>();
    
    this.grid.forEach((cell, index) => {
      if (cell.tile) {
        const key = `${cell.tile.name}-${cell.rotation || 0}`;
        if (!tileMap.has(key)) {
          tileMap.set(key, []);
        }
        tileMap.get(key)!.push(index);
      }
    });

    const duplicates = Array.from(tileMap.entries())
      .filter(([_, positions]) => positions.length > 1);

    const totalDuplicates = duplicates.reduce((sum, [_, positions]) => sum + positions.length - 1, 0);

    return { 
      success: true, 
      message: `Found ${totalDuplicates} duplicate tiles in ${duplicates.length} groups`,
      gridState: [...this.grid],
      debugInfo: { duplicates, tileMap }
    };
  }

  public async analyzeConnections(): Promise<PatternFunctionResult> {
    let totalConnections = 0;
    let possibleConnections = 0;

    // This would need actual edge matching logic - placeholder for now
    const placedTiles = this.grid.filter(cell => cell.tile).length;
    
    return {
      success: true,
      message: `Grid analysis: ${placedTiles} tiles placed, pattern analysis available`,
      gridState: [...this.grid]
    };
  }

  public async removeDuplicates(): Promise<PatternFunctionResult> {
    const duplicateResult = await this.findDuplicates();
    if (!duplicateResult.debugInfo?.duplicates.length) {
      return { success: true, message: 'No duplicates found to remove' };
    }

    // Placeholder - would need sophisticated logic to find missing tiles
    return { 
      success: false, 
      message: 'Duplicate removal requires available tile analysis - use manual method',
      gridState: [...this.grid]
    };
  }

  // NEW UTILITY FUNCTIONS
  public async pairRotationFamilies(): Promise<PatternFunctionResult> {
    // Placeholder for rotation family logic
    return { 
      success: false, 
      message: 'Rotation family pairing requires tile shape analysis - feature coming soon',
      gridState: [...this.grid]
    };
  }

  public async pairMirrorFamilies(): Promise<PatternFunctionResult> {
    // Placeholder for mirror family logic
    return { 
      success: false, 
      message: 'Mirror family pairing requires tile geometry analysis - feature coming soon',
      gridState: [...this.grid]
    };
  }

  // 8. FUNCTION REGISTRY - Available functions for AI
  public getAvailableFunctions(): Array<{name: string, description: string}> {
    return [
      // Edge Matching Functions
      {
        name: 'optimizeEdgeMatching',
        description: 'Smart initial tile placement based on neighbor edge scores'
      },
      {
        name: 'buildLateralEdges',
        description: 'Create horizontal chains with matching lateral edges'
      },
      {
        name: 'buildBottomEdges',
        description: 'Create vertical chains with matching bottom edges'
      },
      {
        name: 'createBeautifulPattern',
        description: 'Run complete Beautiful Edge Matching algorithm'
      },
      {
        name: 'logEdgeSignatures',
        description: 'Debug edge signatures for pattern analysis'
      },

      // Organization Functions
      {
        name: 'fillGrid',
        description: 'Fill empty cells with all available tiles randomly'
      },
      {
        name: 'shuffleGrid',
        description: 'Randomly redistribute all tiles with new rotations'
      },
      {
        name: 'clearGrid',
        description: 'Remove all tiles from the grid'
      },
      {
        name: 'rotateAllTiles',
        description: 'Apply random rotations to all placed tiles'
      },

      // Analysis Functions
      {
        name: 'findDuplicates',
        description: 'Identify and highlight duplicate tiles across entire grid'
      },
      {
        name: 'analyzeConnections',
        description: 'Analyze edge matches and pattern quality metrics'
      },
      {
        name: 'removeDuplicates',
        description: 'Automatically replace duplicates with missing tiles'
      },

      // Utility Functions
      {
        name: 'pairRotationFamilies',
        description: 'Organize tiles by rotation families together'
      },
      {
        name: 'pairMirrorFamilies',
        description: 'Organize tiles by mirror families together'
      }
      },
      {
        name: 'buildBottomEdges',
        description: 'Build vertical chains using two-segment edge matching'
      },
      {
        name: 'createBeautifulPattern',
        description: 'Complete algorithm: optimize + lateral + vertical chains'
      },
      {
        name: 'logEdgeSignatures',
        description: 'Debug helper: display edge signatures for all tiles'
      },
      {
        name: 'customLateralFocus',
        description: 'AI-designed: Strong horizontal flow with double lateral building'
      },
      {
        name: 'customVerticalFocus',
        description: 'AI-designed: Strong vertical flow with double vertical building'
      }
    ];
  }

  // 8. EXECUTE FUNCTION BY NAME - For AI dynamic calling
  public async executeFunction(functionName: string, ...args: any[]): Promise<PatternFunctionResult> {
    const functionMap: Record<string, () => Promise<PatternFunctionResult>> = {
      'optimizeEdgeMatching': () => this.optimizeEdgeMatching(),
      'buildLateralEdges': () => this.buildLateralEdges(),
      'buildBottomEdges': () => this.buildBottomEdges(),
      'createBeautifulPattern': () => this.createBeautifulPattern(),
      'logEdgeSignatures': () => this.logEdgeSignatures(),
      'customLateralFocus': () => this.customLateralFocus(),
      'customVerticalFocus': () => this.customVerticalFocus()
    };

    const func = functionMap[functionName];
    if (!func) {
      return {
        success: false,
        message: `Function '${functionName}' not found. Available: ${Object.keys(functionMap).join(', ')}`
      };
    }

    return await func();
  }
}