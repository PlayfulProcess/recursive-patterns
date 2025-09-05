/**
 * Core types for the tile system
 */

import { TileData } from '../../components/CSVTable';

// Data structure for grid cells
export interface GridCell {
  x: number;
  y: number;
  tile?: TileData;
  // No rotation needed - tiles from CSV already have correct orientation
}

// Result type for function execution
export interface FunctionResult {
  success: boolean;
  message: string;
  gridState?: GridCell[];
}

// Tile relationship maps built from CSV data
export interface TileRelationships {
  mirrorMap: Map<string, { horizontal: string; vertical: string }>;
  shapeGroups: Map<string, TileData[]>;
  edgeIndex: Map<string, TileData[]>;
  tileById: Map<string, TileData>;
}

// Pattern scoring interface
export interface PatternScore {
  edgeScore: number;
  mirrorScore: number;
  colorBalance: number;
  flowScore: number;
  totalScore: number;
}

// Mirror pair structure
export interface MirrorPair {
  pos1: number;
  pos2: number;
  direction: 'horizontal' | 'vertical';
  distance: number;
}