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

  // 7. FUNCTION REGISTRY - Available functions for AI
  public getAvailableFunctions(): Array<{name: string, description: string}> {
    return [
      {
        name: 'optimizeEdgeMatching',
        description: 'Smart initial tile placement based on neighbor edge scores'
      },
      {
        name: 'buildLateralEdges', 
        description: 'Build horizontal chains using two-segment edge matching'
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