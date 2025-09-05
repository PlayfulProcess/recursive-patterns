/**
 * Core Functions Registry
 * Main export and registry for AI access
 */

// Export all types
export type * from './types';

// Import all functions
export { fillGrid } from './fillGrid';
export { 
  optimizeEdgeMatching, 
  calculateEdgeMatchScore, 
  findEdgeMatches 
} from './edgeMatching';
export { 
  buildTileRelationships, 
  findMirrorTile, 
  findRotationFamily 
} from './recursive';
export { 
  calculatePatternScore, 
  findAllMirrorPairs, 
  iterativeImprove 
} from './analysis';
export {
  exportGridToCSV,
  importGridFromCSV,
  downloadCSV,
  validateCSVFile
} from './csvExport';

// Function registry for AI access - centralized and discoverable
export const functionRegistry = {
  // Grid operations
  fillGrid: 'fillGrid',
  optimizeEdgeMatching: 'optimizeEdgeMatching',
  
  // Analysis functions
  calculatePatternScore: 'calculatePatternScore',
  calculateEdgeMatchScore: 'calculateEdgeMatchScore',
  findAllMirrorPairs: 'findAllMirrorPairs',
  iterativeImprove: 'iterativeImprove',
  
  // Relationship functions
  buildTileRelationships: 'buildTileRelationships',
  findMirrorTile: 'findMirrorTile',
  findRotationFamily: 'findRotationFamily',
  findEdgeMatches: 'findEdgeMatches',
  
  // CSV Export/Import functions
  exportGridToCSV: 'exportGridToCSV',
  importGridFromCSV: 'importGridFromCSV',
  downloadCSV: 'downloadCSV',
  validateCSVFile: 'validateCSVFile'
} as const;

// Type for registered function names
export type RegisteredFunction = keyof typeof functionRegistry;

// Export individual functions for direct access
import { fillGrid } from './fillGrid';
import { 
  optimizeEdgeMatching, 
  calculateEdgeMatchScore, 
  findEdgeMatches 
} from './edgeMatching';
import { 
  buildTileRelationships, 
  findMirrorTile, 
  findRotationFamily 
} from './recursive';
import { 
  calculatePatternScore, 
  findAllMirrorPairs, 
  iterativeImprove 
} from './analysis';
import {
  exportGridToCSV,
  importGridFromCSV,
  downloadCSV,
  validateCSVFile
} from './csvExport';

// Function map for dynamic access (AI can use this)
export const functionMap = {
  fillGrid,
  optimizeEdgeMatching,
  calculatePatternScore,
  calculateEdgeMatchScore,
  findAllMirrorPairs,
  iterativeImprove,
  buildTileRelationships,
  findMirrorTile,
  findRotationFamily,
  findEdgeMatches,
  exportGridToCSV,
  importGridFromCSV,
  downloadCSV,
  validateCSVFile
};

// Metadata for each function (for AI understanding)
export const functionMetadata = {
  fillGrid: {
    description: 'Fill grid with all 96 tiles, each used exactly once',
    category: 'grid-operations',
    complexity: 'simple',
    params: ['grid: GridCell[]', 'allTiles: TileData[]'],
    returns: 'GridCell[]'
  },
  optimizeEdgeMatching: {
    description: 'Optimize tile placement to maximize edge color matching',
    category: 'optimization',
    complexity: 'complex',
    params: ['grid: GridCell[]', 'gridWidth?: number', 'gridHeight?: number'],
    returns: 'GridCell[]'
  },
  calculatePatternScore: {
    description: 'Calculate comprehensive pattern quality score for entire grid',
    category: 'analysis',
    complexity: 'moderate',
    params: ['grid: GridCell[]', 'relationships: TileRelationships'],
    returns: 'PatternScore'
  },
  calculateEdgeMatchScore: {
    description: 'Calculate score based on edge matching between adjacent tiles',
    category: 'analysis',
    complexity: 'simple',
    params: ['grid: GridCell[]'],
    returns: 'number'
  },
  findAllMirrorPairs: {
    description: 'Find all mirror tile pairs in current grid with positions',
    category: 'analysis',
    complexity: 'moderate',
    params: ['grid: GridCell[]', 'relationships: TileRelationships'],
    returns: 'MirrorPair[]'
  },
  iterativeImprove: {
    description: 'Generic pattern optimizer using iterative improvement',
    category: 'optimization',
    complexity: 'complex',
    params: ['grid: GridCell[]', 'scoreFn: Function', 'maxIterations: number', 'threshold?: number'],
    returns: 'GridCell[]'
  },
  buildTileRelationships: {
    description: 'Build comprehensive tile relationship maps from CSV data',
    category: 'setup',
    complexity: 'moderate',
    params: ['allTiles: TileData[]'],
    returns: 'TileRelationships'
  },
  findMirrorTile: {
    description: 'Find mirror tile for given tile in specified direction',
    category: 'relationships',
    complexity: 'simple',
    params: ['currentTile: TileData', 'direction: string', 'relationships: TileRelationships'],
    returns: 'TileData | null'
  },
  findRotationFamily: {
    description: 'Find all tiles in same rotation family (same shape, different rotations)',
    category: 'relationships',
    complexity: 'simple',
    params: ['currentTile: TileData', 'relationships: TileRelationships'],
    returns: 'TileData[]'
  },
  findEdgeMatches: {
    description: 'Find tiles with matching edge colors for seamless connections',
    category: 'relationships',
    complexity: 'moderate',
    params: ['currentTile: TileData', 'direction: string', 'relationships: TileRelationships'],
    returns: 'TileData[]'
  },
  exportGridToCSV: {
    description: 'Export current grid state to CSV format with highlighting information',
    category: 'data-management',
    complexity: 'simple',
    params: ['grid: GridCell[]', 'highlightedTiles: Set<string>', 'highlightType: string', 'gridWidth?: number', 'gridHeight?: number'],
    returns: 'ExportResult'
  },
  importGridFromCSV: {
    description: 'Import grid state from CSV data with highlighting restoration',
    category: 'data-management',
    complexity: 'moderate',
    params: ['csvData: string', 'allTiles: TileData[]', 'gridWidth?: number', 'gridHeight?: number'],
    returns: 'ImportResult'
  },
  downloadCSV: {
    description: 'Trigger download of CSV file to user device',
    category: 'data-management',
    complexity: 'simple',
    params: ['csvData: string', 'filename?: string'],
    returns: 'void'
  },
  validateCSVFile: {
    description: 'Validate CSV file before importing, checks format and size',
    category: 'data-management',
    complexity: 'simple',
    params: ['file: File'],
    returns: 'Promise<ValidationResult>'
  }
};

// Helper function to get all available functions (for AI discovery)
export function getAvailableFunctions(): string[] {
  return Object.keys(functionRegistry);
}

// Helper function to get function metadata (for AI understanding)
export function getFunctionMetadata(functionName: RegisteredFunction) {
  return functionMetadata[functionName];
}

// Export legacy object for backward compatibility
export const CoreFunctions = functionMap;