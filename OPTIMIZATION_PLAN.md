# Recursive Patterns Optimization Plan

## Overview
This document outlines a plan to decompose and parameterize the existing edge optimization functions to create configurable, composable optimization strategies. The goal is to enable experimentation with different optimization approaches and identify emerging patterns.

## Current State Analysis

### Existing Functions (from `edgeMatching.ts`)
- **`optimizeEdgeMatching()`**: Main optimization function with hardcoded weights
  - Mirror match weight: 100
  - Rotation match weight: 50  
  - Edge match weight: 10 per edge
  - Uses row-major traversal (left-to-right, top-to-bottom)

- **`findBestTileForPosition()`**: Core scoring logic
- **`countMatchingEdges()`**: Edge compatibility scoring
- **`isMirrorMatch()`** & **`isRotationMatch()`**: Specialized matching functions

### Copilot's Suggestions
1. **Shape Grouping in 2x2 Blocks** - Already implemented with configurable parameters
2. **Single Color Optimization** - Targets specific color matching only
3. **Row Sweep Clustering** - Alternative traversal pattern

## Proposed Decomposition Strategy

### 1. Core Scoring Components
Break down the scoring system into modular, weighted components:

```typescript
interface OptimizationWeights {
  edgeMatching: number;      // Base edge color matching (current: 10)
  mirrorBonus: number;       // Mirror tile preference (current: 100)
  rotationBonus: number;     // Rotation variant preference (current: 50)
  colorPriority: {           // Per-color weighting
    a: number;
    b: number; 
    c: number;
    d: number;
  };
  shapeCluster: number;      // Same shape proximity bonus
  distancePenalty: number;   // Penalty for distant swaps
}
```

### 2. Configurable Traversal Patterns
Replace hardcoded row-major with selectable patterns:

```typescript
type TraversalPattern = 
  | 'row-major'              // Current: left-to-right, top-to-bottom
  | 'column-major'           // top-to-bottom, left-to-right  
  | 'spiral'                 // center-out or corner-in spiral
  | 'diagonal'               // diagonal sweeps
  | 'random-walk'            // stochastic exploration
  | 'block-2x2'              // 2x2 block processing
  | 'checkerboard'           // alternating pattern
```

### 3. Scoring Function Library
Decompose scoring into pluggable functions:

```typescript
interface ScoringFunction {
  name: string;
  weight: number;
  calculate: (tile: TileData, position: GridPosition, context: OptimizationContext) => number;
}

// Example scoring functions:
const edgeColorMatch: ScoringFunction = { ... };
const mirrorProximity: ScoringFunction = { ... };
const shapeCluster: ScoringFunction = { ... };
const colorBalance: ScoringFunction = { ... };
```

## Implementation Plan

### Phase 1: Core Decomposition
1. **Extract Scoring Interface**
   - Create `OptimizationWeights` and `ScoringFunction` types
   - Refactor existing scoring logic into modular functions
   - Implement weight-based score calculation

2. **Parameterize Main Optimizer**
   ```typescript
   function optimizeEdgeMatchingConfigurable(
     grid: GridCell[],
     weights: OptimizationWeights,
     traversal: TraversalPattern,
     scoringFunctions: ScoringFunction[],
     options: OptimizationOptions
   ): OptimizationResult
   ```

### Phase 2: Advanced Scoring Functions
1. **Color-Specific Optimization**
   - Implement single-color focus (from Copilot suggestion)
   - Add per-color weighting system
   - Create color harmony scoring

2. **Shape-Aware Scoring**
   - Implement shape clustering bonus
   - Add rotation family preference
   - Create shape distribution balance

3. **Spatial Awareness**
   - Add distance-based penalties/bonuses
   - Implement local vs global optimization balance
   - Create symmetry preservation scoring

### Phase 3: Alternative Traversal Patterns
1. **Implement Spiral Traversal**
   ```typescript
   function* spiralTraversal(width: number, height: number): Generator<[number, number]>
   ```

2. **Block-Based Processing**
   - 2x2, 3x3, 4x4 block optimization
   - Overlapping vs non-overlapping blocks
   - Multi-scale optimization (coarse-to-fine)

3. **Adaptive Traversal**
   - Dynamic pattern selection based on current grid state
   - Multi-pass optimization with different patterns

### Phase 4: Experimentation Framework
1. **Configuration Presets**
   ```typescript
   const OPTIMIZATION_PRESETS = {
     balanced: { edgeMatching: 10, mirrorBonus: 100, ... },
     colorFocused: { edgeMatching: 50, colorPriority: { a: 100, ... } },
     shapeClustered: { shapeCluster: 200, edgeMatching: 5, ... },
     mirrorHeavy: { mirrorBonus: 500, edgeMatching: 1, ... }
   };
   ```

2. **A/B Testing Infrastructure**
   - Batch optimization with different configurations
   - Score comparison and visualization
   - Pattern emergence detection

3. **Analytics & Reporting**
   - Per-configuration performance metrics
   - Visual diff comparison
   - Optimization history tracking

## API Design

### Main Optimization Function
```typescript
interface OptimizationConfig {
  weights: OptimizationWeights;
  traversal: TraversalPattern;
  scoringFunctions: ScoringFunction[];
  maxIterations?: number;
  convergenceThreshold?: number;
  multiPass?: boolean;
}

function optimizeGrid(
  grid: GridCell[], 
  tiles: TileData[],
  config: OptimizationConfig
): OptimizationResult {
  // Implementation with configurable behavior
}
```

### Convenience Functions
```typescript
// Quick single-color optimization (Copilot suggestion)
function optimizeForColor(grid: GridCell[], color: 'a'|'b'|'c'|'d'): GridCell[];

// Shape clustering (existing 2x2 blocks + variations)
function optimizeShapeDistribution(grid: GridCell[], blockSize: number): GridCell[];

// Mirror-focused optimization  
function optimizeMirrorPairs(grid: GridCell[], direction?: 'horizontal'|'vertical'): GridCell[];
```

## Experimental Questions to Explore

1. **Color Dominance**: Does focusing on one color create better overall patterns?
2. **Shape vs Edge Priority**: What's the optimal balance between shape clustering and edge matching?
3. **Traversal Impact**: How much does traversal pattern affect final quality?
4. **Multi-Pass Benefits**: Do multiple passes with different strategies improve results?
5. **Mirror Weight Sensitivity**: How does mirror bonus weighting affect pattern emergence?

## Expected Benefits

1. **Flexibility**: Easy experimentation with different optimization strategies
2. **Composability**: Mix and match different scoring functions
3. **Debugging**: Individual component analysis and tuning
4. **Pattern Discovery**: Systematic exploration of parameter space
5. **Performance Insights**: Understanding of what actually drives good patterns

## Next Steps

1. Implement Phase 1 (core decomposition)
2. Create initial configuration presets
3. Build comparison framework for A/B testing
4. Run systematic experiments to identify optimal configurations
5. Document findings and update default parameters

This modular approach will enable systematic exploration of the optimization space while maintaining the existing functionality as a baseline.