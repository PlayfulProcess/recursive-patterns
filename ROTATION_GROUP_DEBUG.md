# Rotation Group Feature - Debug Documentation

## Problem Summary
When using "Rotation Group" priority with "Unique Tiles Only" enabled, we're getting 92 duplicates instead of 0. The system is only placing 4 tiles correctly, then falling back to the old complex scoring system.

## What We're Trying to Achieve

### Core Concept: Same Rotation Pattern, Different Shapes
1. **Every 4 tiles = one rotation cycle** (e.g., [0,1,2,3])
2. **Each cycle should use the SAME rotation sequence but DIFFERENT shape families**
3. **Should work for ALL patterns** (not just 2x2 blocks)
4. **Must respect "Unique Tiles Only"** - each tile used exactly once

### Example of Expected Behavior:
```
Cycle 1 (tiles 0-3):   Rotation [0,1,2,3] with shapes from family A
Cycle 2 (tiles 4-7):   Rotation [0,1,2,3] with shapes from family B  
Cycle 3 (tiles 8-11):  Rotation [0,1,2,3] with shapes from family C
... and so on for all 96 tiles
```

## Current Implementation Status

### Functions Created/Modified:

#### 1. `findBestShape(targetRotation, usedShapes)`
**Purpose**: Find an unused tile with specific rotation, prioritizing new shapes
**Current Logic**:
```typescript
1. Filter all tiles by: !usedTiles.has(tile.id) && tile.rotation === targetRotation
2. First try: tiles with shapes NOT in usedShapes set
3. Fallback: any tile with target rotation
4. Returns: first matching tile or null
```

#### 2. `findBestTile(position, previousTile)` 
**Purpose**: Main tile selection function
**Current Logic**:
```typescript
1. Check if rotation-group is selected AND uniqueTilesOnly is true
2. Calculate step number from position in traversal sequence
3. Determine position in 4-tile cycle (0-3)
4. Track shapes used in current cycle
5. Call findBestShape with target rotation and used shapes
```

#### 3. `generateAllTiles()` - Pre-generation function
**Purpose**: Generate all 96 tiles at once
**Current Logic**:
```typescript
1. Loops through traversal sequence
2. For rotation-group mode:
   - Calculate position in cycle
   - Track shapes in current cycle  
   - Find best tile
3. Falls back to findBestTileForPreGeneration if no tile found
```

## CRITICAL ISSUE IDENTIFIED

### The Split Between Pre-generation and Step-by-Step

**THE PROBLEM**: We have TWO separate paths that don't share state properly:

1. **Pre-generation path** (`generateAllTiles`):
   - Uses local `newUsedTiles` Set
   - Uses local `newGrid` array
   - Generates all 96 tiles at once
   - Updates global state only at the end

2. **Step-by-step path** (`findBestTile`):
   - Uses global `usedTiles` Set
   - Uses global `renderingGrid` array
   - Generates one tile at a time
   - Updates global state incrementally

### Why This Causes Issues:

1. **State Mismatch**: Pre-generation uses different state tracking than step-by-step
2. **Early Exit**: Pre-generation only places 4 tiles, then falls back to complex scoring
3. **No Shared Logic**: Similar code duplicated in two places with slight differences

## Debugging Observations from Console Logs

From CLAUDE.md logs:
```
🎯 Pre-generating all tiles...
[Hundreds of "Rotation family bonus" messages - OLD LOGIC RUNNING]
✅ Pre-generated all tiles: 4 / 96
```

This shows:
1. Rotation group logic only handled 4 tiles
2. Fell back to old complex scoring for remaining 92 tiles
3. Old logic creates duplicates (hence 92 duplicates)

## Suspected Root Causes

1. **bestTile variable scoping**: In pre-generation, `let bestTile` might be declared wrong
2. **Fallback too aggressive**: Falls back to `findBestTileForPreGeneration` too quickly
3. **State not tracked**: `newUsedTiles` not updated when tiles placed by rotation logic
4. **Position vs Step confusion**: Mixing grid positions with sequence steps

## Progress Made

### ✅ Completed:
1. **Added "Instant" animation speed** option (1ms delay)
2. **Added debug logging** to understand why rotation logic fails
3. **Identified exact location of problematic code**: 
   - Pre-generation useEffect at line 366-428
   - Contains setTimeout that calls pre-generation after 100ms delay

### 🔧 **CRITICAL FINDING - Solution Approach:**
**ELIMINATE PRE-GENERATION COMPLETELY**
- Pre-generation is the root cause of all issues
- Step-by-step animation works correctly 
- With "Instant" speed, animation gives same UX as pre-generation
- Single code path = single source of truth

## Next Steps When Resuming

### 1. Remove Pre-Generation useEffect (PRIORITY)
**Location**: PositioningVisualization.tsx lines 374-427
**Remove this section:**
```typescript
// Pre-generate all tiles immediately when pattern changes
if (sequence.length > 0 && allTiles.length > 0) {
  setTimeout(() => {
    console.log('🎯 Pre-generating all tiles...');
    // ... entire setTimeout block ...
  }, 100);
}
```

**Keep only:**
```typescript
// Update traversal sequence when pattern changes
useEffect(() => {
  const sequence = generateTraversalSequence(selectedPattern, gridWidth, gridHeight);
  setTraversalSequence(sequence);
  setCurrentStep(0);
  setRenderingGrid(new Array(totalCells).fill(null));
  setUsedTiles(new Set());
  setPatternTemplate([]);
}, [selectedPattern, totalCells]);
```

### 2. Remove Helper Functions
- Remove `findBestTileForPreGeneration` function
- Remove any other pre-generation specific code

### 3. Test the Fix
- Set animation to "Instant" speed  
- Use Rotation Group with 2x2 blocks
- Should see 0 duplicates and proper rotation patterns

### 4. Final Verification
- Test with ALL patterns (spiral, row-major, etc.)
- Verify rotation group works universally
- Confirm step-by-step logic handles all 96 tiles correctly

## Test Cases to Verify Fix

1. **2x2 Blocks + Rotation Group + Unique Tiles ON**
   - Should place all 96 tiles
   - Should show 0 duplicates
   - Console should show rotation pattern repeating

2. **Spiral Pattern + Rotation Group + Unique Tiles ON**  
   - Should work same as 2x2 blocks
   - Every 4 tiles = new shape family

3. **Row Major + Rotation Group + Unique Tiles ON**
   - Should work for all patterns
   - Rotation sequence should be consistent

## Key Insights

1. **The 92 duplicates** come from old scoring logic taking over after 4 tiles
2. **The "4 tiles only" issue** suggests early exit from rotation logic
3. **Pre-generation vs step-by-step split** is core architectural problem
4. **Need unified approach** that works same way for both paths

## Code Architecture Recommendation

```typescript
// Single unified function for rotation group logic
function getRotationGroupTile(
  stepNumber: number,
  rotationSequence: string,
  usedTilesSet: Set<string>,
  currentGrid: (TileData | null)[]
): TileData | null {
  // ALL rotation group logic here
  // Used by BOTH pre-gen and step-by-step
}
```

This would ensure consistent behavior regardless of generation method.