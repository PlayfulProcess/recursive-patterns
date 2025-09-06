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
  optimizeGridConfigurable,
  optimizeWithPreset,
  optimizeForSingleColor
} from './optimizationEngine';
export type {
  OptimizationConfig,
  OptimizationResult,  
  OptimizationWeights,
  TraversalPattern
} from './optimizationConfig';
export {
  OPTIMIZATION_PRESETS
} from './optimizationConfig';
export type {
  ScoringFunction
} from './optimizationConfig';
export {
  DEFAULT_SCORING_FUNCTIONS,
  createColorSpecificMatching,
  SCORING_PRESETS
} from './scoringFunctions';
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
export {
  analyzePatternFromCSV,
  calculateEdgeMatchScoreFromCSV,
  findOptimizationTargetsFromCSV,
  compareGridStates,
  buildPatternLibrary,
  getImprovementSuggestions,
  analyzeMirrorPairsFromCSV
} from './csvAnalysis';

// Function registry for AI access - centralized and discoverable
export const functionRegistry = {
  // Grid operations
  fillGrid: 'fillGrid',
  optimizeEdgeMatching: 'optimizeEdgeMatching',
  
  // NEW: Configurable optimization functions
  optimizeGridConfigurable: 'optimizeGridConfigurable',
  optimizeWithPreset: 'optimizeWithPreset',
  optimizeForSingleColor: 'optimizeForSingleColor',
  
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
  validateCSVFile: 'validateCSVFile',
  
  // CSV Analysis functions (ULTRA-FAST)
  analyzePatternFromCSV: 'analyzePatternFromCSV',
  calculateEdgeMatchScoreFromCSV: 'calculateEdgeMatchScoreFromCSV',
  findOptimizationTargetsFromCSV: 'findOptimizationTargetsFromCSV',
  compareGridStates: 'compareGridStates',
  buildPatternLibrary: 'buildPatternLibrary',
  getImprovementSuggestions: 'getImprovementSuggestions',
  analyzeMirrorPairsFromCSV: 'analyzeMirrorPairsFromCSV'
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
import {
  analyzePatternFromCSV,
  calculateEdgeMatchScoreFromCSV,
  findOptimizationTargetsFromCSV,
  compareGridStates,
  buildPatternLibrary,
  getImprovementSuggestions,
  analyzeMirrorPairsFromCSV
} from './csvAnalysis';
import {
  optimizeGridConfigurable,
  optimizeWithPreset,
  optimizeForSingleColor
} from './optimizationEngine';
import {
  OptimizationConfig,
  OptimizationResult,
  OptimizationWeights,
  TraversalPattern,
  OPTIMIZATION_PRESETS
} from './optimizationConfig';
import {
  ScoringFunction,
  DEFAULT_SCORING_FUNCTIONS,
  createColorSpecificMatching,
  SCORING_PRESETS
} from './scoringFunctions';

// Function map for dynamic access (AI can use this)
export const functionMap = {
  fillGrid,
  optimizeEdgeMatching,
  optimizeGridConfigurable,
  optimizeWithPreset,
  optimizeForSingleColor,
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
  validateCSVFile,
  analyzePatternFromCSV,
  calculateEdgeMatchScoreFromCSV,
  findOptimizationTargetsFromCSV,
  compareGridStates,
  buildPatternLibrary,
  getImprovementSuggestions,
  analyzeMirrorPairsFromCSV
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
  },
  analyzePatternFromCSV: {
    description: 'ULTRA-FAST: Comprehensive pattern analysis from CSV data (10x faster than grid analysis)',
    category: 'csv-analysis',
    complexity: 'simple',
    params: ['csvData: GridExportData[]'],
    returns: 'PatternAnalysis'
  },
  calculateEdgeMatchScoreFromCSV: {
    description: 'ULTRA-FAST: Calculate edge matching score from CSV data',
    category: 'csv-analysis',
    complexity: 'simple',
    params: ['csvData: GridExportData[]'],
    returns: 'number'
  },
  findOptimizationTargetsFromCSV: {
    description: 'ULTRA-FAST: Find low-scoring positions from CSV data for optimization',
    category: 'csv-analysis',
    complexity: 'simple',
    params: ['csvData: GridExportData[]'],
    returns: 'GridExportData[]'
  },
  compareGridStates: {
    description: 'ULTRA-FAST: Compare two grid states from CSV exports',
    category: 'csv-analysis',
    complexity: 'simple',
    params: ['csvBefore: GridExportData[]', 'csvAfter: GridExportData[]'],
    returns: 'GridComparison'
  },
  buildPatternLibrary: {
    description: 'ULTRA-FAST: Build library of high-quality patterns from multiple CSV exports',
    category: 'csv-analysis',
    complexity: 'moderate',
    params: ['csvExports: GridExportData[][]'],
    returns: 'PatternLibrary'
  },
  getImprovementSuggestions: {
    description: 'ULTRA-FAST: Get AI-powered improvement suggestions from CSV data',
    category: 'csv-analysis',
    complexity: 'simple',
    params: ['csvData: GridExportData[]'],
    returns: 'ImprovementSuggestion[]'
  },
  analyzeMirrorPairsFromCSV: {
    description: 'ULTRA-FAST: Analyze mirror relationships from CSV data',
    category: 'csv-analysis',
    complexity: 'simple',
    params: ['csvData: GridExportData[]'],
    returns: 'MirrorAnalysis'
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