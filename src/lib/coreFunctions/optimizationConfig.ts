/**
 * Configuration interfaces for parameterized optimization
 */

import { TileData } from '../../components/CSVTable';
import { GridCell, TileRelationships } from './types';


// Core optimization weights configuration
export interface OptimizationWeights {
  edgeMatching: number;      // Base edge color matching score
  mirrorBonus: number;       // Mirror tile preference bonus
  rotationBonus: number;     // Rotation variant preference bonus
  colorPriority: {           // Per-color weighting multipliers
    a: number;
    b: number;
    c: number;
    d: number;
  };
  shapeCluster: number;      // Same shape proximity bonus
  distancePenalty: number;   // Penalty for distant tile swaps
}

// Context information for scoring calculations
export interface OptimizationContext {
  grid: GridCell[];
  columns: number;
  rows: number;
  position: number;
  row: number;
  col: number;
  relationships: TileRelationships;
  usedPositions: Set<number>;
  targetTile?: TileData;
}

// Individual scoring function interface
export interface ScoringFunction {
  name: string;
  description: string;
  calculate: (tile: TileData, context: OptimizationContext) => number;
}

// Traversal pattern options
export type TraversalPattern = 
  | 'row-major'              // left-to-right, top-to-bottom (current default)
  | 'column-major'           // top-to-bottom, left-to-right
  | 'spiral-clockwise'       // spiral from center outward
  | 'spiral-counter'         // counter-clockwise spiral
  | 'diagonal'               // diagonal sweeps
  | 'random-walk'            // stochastic exploration
  | 'block-2x2'              // 2x2 block processing
  | 'checkerboard';          // alternating pattern

// Main optimization configuration
export interface OptimizationConfig {
  weights: OptimizationWeights;
  traversal: TraversalPattern;
  scoringFunctions: ScoringFunction[];
  maxIterations?: number;
  convergenceThreshold?: number;
  multiPass?: boolean;
  debug?: boolean;
}

// Optimization result with metadata
export interface OptimizationResult {
  grid: GridCell[];
  swaps: number;
  iterations: number;
  finalScore: number;
  scoreHistory: number[];
  converged: boolean;
  executionTime: number;
  config: OptimizationConfig;
}

// Default weight configurations
export const DEFAULT_WEIGHTS: OptimizationWeights = {
  edgeMatching: 10,
  mirrorBonus: 100,
  rotationBonus: 50,
  colorPriority: { a: 1, b: 1, c: 1, d: 1 },
  shapeCluster: 20,
  distancePenalty: 1
};

// Preset configurations for common optimization strategies
export const OPTIMIZATION_PRESETS: Record<string, Partial<OptimizationConfig>> = {
  // Current default behavior
  classic: {
    weights: DEFAULT_WEIGHTS,
    traversal: 'row-major'
  },
  
  // Focus heavily on edge color matching
  edgeFocused: {
    weights: {
      ...DEFAULT_WEIGHTS,
      edgeMatching: 100,
      mirrorBonus: 20,
      rotationBonus: 10
    },
    traversal: 'row-major'
  },
  
  // Prioritize mirror relationships
  mirrorHeavy: {
    weights: {
      ...DEFAULT_WEIGHTS,
      mirrorBonus: 500,
      edgeMatching: 5,
      rotationBonus: 25
    },
    traversal: 'row-major'
  },
  
  // Focus on shape clustering
  shapeClustered: {
    weights: {
      ...DEFAULT_WEIGHTS,
      shapeCluster: 200,
      edgeMatching: 5,
      mirrorBonus: 50
    },
    traversal: 'block-2x2'
  },
  
  // Single color optimization (color 'a' priority)
  colorFocusedA: {
    weights: {
      ...DEFAULT_WEIGHTS,
      edgeMatching: 50,
      colorPriority: { a: 10, b: 0.1, c: 0.1, d: 0.1 },
      mirrorBonus: 20
    },
    traversal: 'row-major'
  },
  
  // Balanced multi-pass approach
  multiPass: {
    weights: DEFAULT_WEIGHTS,
    traversal: 'spiral-clockwise',
    multiPass: true,
    maxIterations: 3
  },
  
  // Experimental spiral pattern
  spiral: {
    weights: {
      ...DEFAULT_WEIGHTS,
      distancePenalty: 5 // Reduce long-distance swaps in spiral
    },
    traversal: 'spiral-clockwise'
  }
};