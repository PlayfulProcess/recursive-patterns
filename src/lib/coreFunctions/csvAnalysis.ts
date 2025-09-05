/**
 * CSV-Based Analysis Functions
 * Ultra-fast pattern analysis using pre-calculated CSV data
 */

import { GridExportData } from './csvExport';

export interface PatternAnalysis {
  overallScore: number;
  maxPossibleScore: number;
  efficiency: number;
  edgeMatchDistribution: {
    perfect: number; // 4 matches
    good: number;    // 3 matches  
    fair: number;    // 2 matches
    poor: number;    // 1 match
    isolated: number; // 0 matches
  };
  shapeDistribution: Record<number, number>;
  criticalCells: GridExportData[];
  recommendations: string[];
}

export interface GridComparison {
  scoreImprovement: number;
  efficiencyChange: number;
  shapeChanges: Record<number, number>;
  matchingImprovements: number;
  degradedCells: number;
}

/**
 * ULTRA-FAST: Calculate comprehensive pattern analysis from CSV data
 * Before: 200+ lines of grid traversal | After: 20 lines of array operations
 */
export function analyzePatternFromCSV(csvData: GridExportData[]): PatternAnalysis {
  const totalCells = csvData.length;
  const totalScore = csvData.reduce((sum, cell) => sum + cell.neighborScore, 0);
  const maxPossible = calculateMaxPossibleScore(csvData);
  
  // Edge match distribution - instant calculation
  const edgeMatchDistribution = {
    perfect: csvData.filter(cell => cell.neighborScore === 4).length,
    good: csvData.filter(cell => cell.neighborScore === 3).length,
    fair: csvData.filter(cell => cell.neighborScore === 2).length,
    poor: csvData.filter(cell => cell.neighborScore === 1).length,
    isolated: csvData.filter(cell => cell.neighborScore === 0).length
  };
  
  // Shape distribution - one-pass calculation
  const shapeDistribution: Record<number, number> = {};
  csvData.forEach(cell => {
    shapeDistribution[cell.shapeFamily] = (shapeDistribution[cell.shapeFamily] || 0) + 1;
  });
  
  // Critical cells (low-performing)
  const criticalCells = csvData.filter(cell => cell.neighborScore < 2);
  
  // Smart recommendations
  const recommendations = generateRecommendations(csvData, edgeMatchDistribution);
  
  return {
    overallScore: totalScore,
    maxPossibleScore: maxPossible,
    efficiency: maxPossible > 0 ? totalScore / maxPossible : 0,
    edgeMatchDistribution,
    shapeDistribution,
    criticalCells,
    recommendations
  };
}

/**
 * ULTRA-FAST: Calculate edge matching score from CSV
 * Before: Complex grid traversal | After: Simple reduction
 */
export function calculateEdgeMatchScoreFromCSV(csvData: GridExportData[]): number {
  const totalMatches = csvData.reduce((sum, cell) => sum + cell.neighborScore, 0);
  const maxPossible = calculateMaxPossibleScore(csvData);
  return maxPossible > 0 ? totalMatches / maxPossible : 0;
}

/**
 * ULTRA-FAST: Find optimization targets from CSV
 * Before: O(n²) position checking | After: O(n) filtering
 */
export function findOptimizationTargetsFromCSV(csvData: GridExportData[]): GridExportData[] {
  return csvData
    .filter(cell => cell.neighborScore < 2)
    .sort((a, b) => a.neighborScore - b.neighborScore); // Worst first
}

/**
 * ULTRA-FAST: Compare two grid states
 */
export function compareGridStates(csvBefore: GridExportData[], csvAfter: GridExportData[]): GridComparison {
  const scoreBefore = csvBefore.reduce((sum, cell) => sum + cell.neighborScore, 0);
  const scoreAfter = csvAfter.reduce((sum, cell) => sum + cell.neighborScore, 0);
  
  const maxBefore = calculateMaxPossibleScore(csvBefore);
  const maxAfter = calculateMaxPossibleScore(csvAfter);
  
  const efficiencyBefore = maxBefore > 0 ? scoreBefore / maxBefore : 0;
  const efficiencyAfter = maxAfter > 0 ? scoreAfter / maxAfter : 0;
  
  // Shape distribution changes
  const shapeChangesBefore: Record<number, number> = {};
  const shapeChangesAfter: Record<number, number> = {};
  
  csvBefore.forEach(cell => {
    shapeChangesBefore[cell.shapeFamily] = (shapeChangesBefore[cell.shapeFamily] || 0) + 1;
  });
  
  csvAfter.forEach(cell => {
    shapeChangesAfter[cell.shapeFamily] = (shapeChangesAfter[cell.shapeFamily] || 0) + 1;
  });
  
  const shapeChanges: Record<number, number> = {};
  for (const shape in shapeChangesAfter) {
    const before = shapeChangesBefore[shape] || 0;
    const after = shapeChangesAfter[shape] || 0;
    shapeChanges[shape] = after - before;
  }
  
  // Count improvements and degradations
  const improvements = csvAfter.filter((cellAfter, index) => {
    const cellBefore = csvBefore[index];
    return cellBefore && cellAfter.neighborScore > cellBefore.neighborScore;
  }).length;
  
  const degraded = csvAfter.filter((cellAfter, index) => {
    const cellBefore = csvBefore[index];
    return cellBefore && cellAfter.neighborScore < cellBefore.neighborScore;
  }).length;
  
  return {
    scoreImprovement: scoreAfter - scoreBefore,
    efficiencyChange: efficiencyAfter - efficiencyBefore,
    shapeChanges,
    matchingImprovements: improvements,
    degradedCells: degraded
  };
}

/**
 * ULTRA-FAST: Build pattern library from high-quality CSV exports
 */
export function buildPatternLibrary(csvExports: GridExportData[][]): {
  highQuality: GridExportData[][];
  patterns: any[];
  averageScores: number[];
} {
  const highQuality = csvExports.filter(csv => {
    const score = calculateEdgeMatchScoreFromCSV(csv);
    return score > 0.8; // High quality only
  });
  
  const patterns = highQuality.map(csv => extractPatternFeatures(csv));
  const averageScores = csvExports.map(csv => calculateEdgeMatchScoreFromCSV(csv));
  
  return { highQuality, patterns, averageScores };
}

/**
 * ULTRA-FAST: Get improvement suggestions from CSV data
 */
export function getImprovementSuggestions(csvData: GridExportData[]): {
  position: string;
  currentScore: number;
  issues: string[];
  potential: number;
}[] {
  const lowScoreCells = csvData.filter(cell => cell.neighborScore < 3);
  
  return lowScoreCells.map(cell => {
    const issues: string[] = [];
    let potential = 0;
    
    if (cell.northMatch === 0) { issues.push('North edge mismatch'); potential++; }
    if (cell.eastMatch === 0) { issues.push('East edge mismatch'); potential++; }
    if (cell.southMatch === 0) { issues.push('South edge mismatch'); potential++; }
    if (cell.westMatch === 0) { issues.push('West edge mismatch'); potential++; }
    
    return {
      position: `${cell.row},${cell.col}`,
      currentScore: cell.neighborScore,
      issues,
      potential: 4 - cell.neighborScore // How much could be improved
    };
  }).sort((a, b) => b.potential - a.potential); // Highest potential first
}

/**
 * ULTRA-FAST: Mirror pair analysis from CSV using position data
 */
export function analyzeMirrorPairsFromCSV(csvData: GridExportData[]): {
  horizontalPairs: number;
  verticalPairs: number;
  totalRenderedPairs: number;
  potentialPairs: number;
  mirrorPlacementPercentage: number;
} {
  let horizontalPairs = 0;
  let verticalPairs = 0;
  
  // Count tiles with adjacent mirror positions
  csvData.forEach(cell => {
    if (cell.mirrorH_position) horizontalPairs++;
    if (cell.mirrorV_position) verticalPairs++;
  });
  
  const totalRenderedPairs = horizontalPairs + verticalPairs;
  
  // Each of the 96 tiles can potentially have 2 mirrors adjacent (horizontal and vertical)
  // So maximum possible adjacencies is 96 * 2 = 192
  const potentialPairs = csvData.length * 2;
  
  const mirrorPlacementPercentage = potentialPairs > 0 ? (totalRenderedPairs / potentialPairs) * 100 : 0;
  
  return { 
    horizontalPairs, 
    verticalPairs, 
    totalRenderedPairs,
    potentialPairs,
    mirrorPlacementPercentage
  };
}

/**
 * Calculate theoretical maximum score based on grid dimensions
 */
function calculateMaxPossibleScore(csvData: GridExportData[]): number {
  if (csvData.length === 0) return 0;
  
  // Find grid dimensions
  const maxRow = Math.max(...csvData.map(cell => cell.row));
  const maxCol = Math.max(...csvData.map(cell => cell.col));
  
  // Calculate maximum possible edges (each internal edge counted once)
  const horizontalEdges = (maxCol - 1) * maxRow;
  const verticalEdges = maxCol * (maxRow - 1);
  
  return horizontalEdges + verticalEdges;
}

/**
 * Generate smart recommendations based on CSV analysis
 */
function generateRecommendations(csvData: GridExportData[], distribution: any): string[] {
  const recommendations: string[] = [];
  const totalCells = csvData.length;
  
  if (distribution.isolated > 0) {
    recommendations.push(`${distribution.isolated} isolated tiles need attention - consider repositioning`);
  }
  
  if (distribution.poor > totalCells * 0.3) {
    recommendations.push('High number of poor connections - try global optimization');
  }
  
  if (distribution.perfect < totalCells * 0.1) {
    recommendations.push('Low number of perfect matches - focus on edge matching optimization');
  }
  
  const shapeCounts = csvData.reduce((acc, cell) => {
    acc[cell.shapeFamily] = (acc[cell.shapeFamily] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  const shapeVariance = Object.values(shapeCounts).reduce((sum, count) => sum + Math.pow(count - totalCells/4, 2), 0);
  if (shapeVariance > totalCells * 2) {
    recommendations.push('Uneven shape distribution - consider balancing shape families');
  }
  
  return recommendations;
}

/**
 * Extract pattern features for machine learning
 */
function extractPatternFeatures(csvData: GridExportData[]): any {
  const analysis = analyzePatternFromCSV(csvData);
  
  return {
    efficiency: analysis.efficiency,
    shapeEntropy: calculateShapeEntropy(analysis.shapeDistribution),
    matchingPattern: [
      analysis.edgeMatchDistribution.perfect,
      analysis.edgeMatchDistribution.good,
      analysis.edgeMatchDistribution.fair,
      analysis.edgeMatchDistribution.poor,
      analysis.edgeMatchDistribution.isolated
    ],
    criticalityScore: analysis.criticalCells.length / csvData.length
  };
}

/**
 * Calculate shape distribution entropy (diversity measure)
 */
function calculateShapeEntropy(shapeDistribution: Record<number, number>): number {
  const total = Object.values(shapeDistribution).reduce((sum, count) => sum + count, 0);
  if (total === 0) return 0;
  
  return Object.values(shapeDistribution).reduce((entropy, count) => {
    if (count === 0) return entropy;
    const probability = count / total;
    return entropy - probability * Math.log2(probability);
  }, 0);
}