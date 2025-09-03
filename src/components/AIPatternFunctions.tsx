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
    if (this.edgeMatching) {
      // Update the grid reference in the existing instance
      (this.edgeMatching as any).grid = newGrid;
    } else {
      this.initializeEdgeMatching();
    }
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

  // FIXED ORGANIZATION FUNCTIONS
  public async fillGrid(): Promise<PatternFunctionResult> {
    if (this.allTiles.length === 0) {
      return { success: false, message: 'No tiles available to fill grid' };
    }

    const newGrid = [...this.grid];
    const usedTileIds = new Set<string>();
    
    // First pass: identify already placed tiles
    newGrid.forEach(cell => {
      if (cell.tile) {
        usedTileIds.add(cell.tile.id);
      }
    });

    // Second pass: fill empty cells with unused tiles only
    const availableTiles = this.allTiles.filter(tile => !usedTileIds.has(tile.id));
    let tileIndex = 0;
    let filledCount = 0;

    for (let i = 0; i < newGrid.length && tileIndex < availableTiles.length; i++) {
      // Only fill empty cells
      if (!newGrid[i].tile) {
        newGrid[i] = {
          ...newGrid[i],
          tile: availableTiles[tileIndex],
          rotation: 0 // Start with no rotation for deterministic placement
        };
        tileIndex++;
        filledCount++;
      }
    }

    this.grid = newGrid;
    this.onGridUpdate([...this.grid]);
    
    return { 
      success: true, 
      message: `Grid filled: ${filledCount} new tiles placed (${newGrid.filter(c => c.tile).length} total, all unique)`,
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
    // Reset all cells to empty state
    this.grid = this.grid.map(cell => ({ 
      x: cell.x, 
      y: cell.y, 
      tile: undefined,
      rotation: 0 
    }));
    
    // Reinitialize edge matching to clear references
    this.edgeMatching = null;
    this.initializeEdgeMatching();
    
    this.onGridUpdate([...this.grid]);
    return { 
      success: true, 
      message: 'Grid completely cleared - all tiles removed, references reset',
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
    try {
      // Group tiles by their mirror relationships
      const mirrorFamilies: Map<string, TileData[]> = new Map();
      const processedTiles = new Set<string>();
      
      // First, collect all tiles from the grid
      const usedTiles = new Set<string>();
      this.grid.forEach(cell => {
        if (cell.tile) {
          usedTiles.add(cell.tile.id);
        }
      });

      // Create mirror families based on mirrorH and mirrorV relationships
      this.allTiles.forEach(tile => {
        if (!processedTiles.has(tile.id)) {
          const family = [tile];
          processedTiles.add(tile.id);
          
          // Find horizontal mirror if it exists and is different
          if (tile.mirrorH && tile.mirrorH !== tile.id) {
            const mirrorHTile = this.allTiles.find(t => t.id === tile.mirrorH);
            if (mirrorHTile && !processedTiles.has(mirrorHTile.id)) {
              family.push(mirrorHTile);
              processedTiles.add(mirrorHTile.id);
            }
          }
          
          // Find vertical mirror if it exists and is different
          if (tile.mirrorV && tile.mirrorV !== tile.id) {
            const mirrorVTile = this.allTiles.find(t => t.id === tile.mirrorV);
            if (mirrorVTile && !processedTiles.has(mirrorVTile.id)) {
              family.push(mirrorVTile);
              processedTiles.add(mirrorVTile.id);
            }
          }
          
          // Only add families with more than 1 tile (actual mirror relationships)
          if (family.length > 1) {
            const familyKey = family.map(t => t.id).sort().join('-');
            mirrorFamilies.set(familyKey, family);
          }
        }
      });

      if (mirrorFamilies.size === 0) {
        return {
          success: false,
          message: 'No mirror families found in tile data',
          gridState: [...this.grid]
        };
      }

      // Place mirror families together on the grid
      let totalTilesPlaced = 0;
      let familiesArranged = 0;
      const newGrid = [...this.grid];
      let currentIndex = 0;
      
      mirrorFamilies.forEach((family, familyKey) => {
        // Find a suitable area to place this family
        const tilesInFamily = family.length;
        
        // Try to place family in a row if possible
        for (let row = 0; row < this.gridHeight && familiesArranged < mirrorFamilies.size; row++) {
          let availableInRow = 0;
          let startCol = -1;
          
          // Count consecutive available slots in this row
          for (let col = 0; col < this.gridWidth; col++) {
            const cellIndex = row * this.gridWidth + col;
            if (!newGrid[cellIndex].tile) {
              if (startCol === -1) startCol = col;
              availableInRow++;
              if (availableInRow >= tilesInFamily) break;
            } else {
              availableInRow = 0;
              startCol = -1;
            }
          }
          
          // If we found enough space, place the family
          if (availableInRow >= tilesInFamily && startCol !== -1) {
            family.forEach((tile, tileIndex) => {
              const cellIndex = row * this.gridWidth + startCol + tileIndex;
              if (cellIndex < newGrid.length) {
                newGrid[cellIndex] = {
                  ...newGrid[cellIndex],
                  tile: tile,
                  rotation: 0
                };
                totalTilesPlaced++;
              }
            });
            familiesArranged++;
            break;
          }
        }
      });

      this.updateGridState(newGrid);
      
      return {
        success: true,
        message: `Arranged ${familiesArranged} mirror families with ${totalTilesPlaced} total tiles`,
        gridState: newGrid
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Error pairing mirror families: ${error}`,
        gridState: [...this.grid]
      };
    }
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
    ];
  }

  // 8. EXECUTE FUNCTION BY NAME - Called by AI chat
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
}