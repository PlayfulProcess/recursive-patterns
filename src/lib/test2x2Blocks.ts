/**
 * Test script to verify 2x2 block traversal and shape clustering
 * Run this in the browser console to test the optimization
 */

import { optimizeWithPreset, optimizeGridConfigurable } from './coreFunctions/optimizationEngine';
import { GridCell } from './coreFunctions/types';
import { TileData } from '../components/CSVTable';

export function test2x2BlockTraversal() {
  console.log('🧪 Testing 2x2 Block Traversal Pattern');
  console.log('=========================================');
  
  // Create a test grid with known tile shapes
  const testGrid: GridCell[] = [];
  const testTiles: TileData[] = [];
  
  // Create 96 test tiles (12x8 grid) with 4 different shapes
  const shapes = ['triangle', 'square', 'circle', 'hexagon'];
  
  for (let i = 0; i < 96; i++) {
    const tile: TileData = {
      id: i,
      edgeN: 'a',
      edgeE: 'b', 
      edgeS: 'c',
      edgeW: 'd',
      shape: shapes[i % 4], // Cycle through shapes
      color: 'blue',
      pattern: 'solid',
      mirrorH: -1,
      mirrorV: -1,
      rotation90: -1,
      rotation180: -1,
      rotation270: -1
    };
    
    testTiles.push(tile);
    
    // Scatter tiles randomly in grid initially
    testGrid.push({
      x: i % 12,
      y: Math.floor(i / 12),
      tile: testTiles[Math.floor(Math.random() * testTiles.length)]
    });
  }
  
  // Test 1: Verify traversal order
  console.log('\n📍 Test 1: Traversal Order Verification');
  const traversalOrder: number[] = [];
  
  // Mock the traversal to capture order
  const mockGrid = [...testGrid];
  let position = 0;
  
  // Generate traversal pattern for 12x8 grid
  function* generateBlock2x2Traversal(cols: number, rows: number) {
    for (let blockRow = 0; blockRow < rows; blockRow += 2) {
      for (let blockCol = 0; blockCol < cols; blockCol += 2) {
        for (let r = blockRow; r < Math.min(blockRow + 2, rows); r++) {
          for (let c = blockCol; c < Math.min(blockCol + 2, cols); c++) {
            yield r * cols + c;
          }
        }
      }
    }
  }
  
  for (const pos of generateBlock2x2Traversal(12, 8)) {
    traversalOrder.push(pos);
  }
  
  // Verify 2x2 block pattern
  console.log('First 8 positions (should be 2 blocks):');
  console.log('Block 1 (top-left 2x2):', traversalOrder.slice(0, 4));
  console.log('Block 2 (next 2x2):', traversalOrder.slice(4, 8));
  
  // Expected: [0,1,12,13] then [2,3,14,15] for first two blocks
  const expected = [0, 1, 12, 13, 2, 3, 14, 15];
  const actual = traversalOrder.slice(0, 8);
  const traversalCorrect = JSON.stringify(expected) === JSON.stringify(actual);
  
  console.log(`✅ Traversal pattern is ${traversalCorrect ? 'CORRECT' : 'INCORRECT'}`);
  if (!traversalCorrect) {
    console.log('Expected:', expected);
    console.log('Actual:', actual);
  }
  
  // Test 2: Shape Clustering with 2x2 blocks
  console.log('\n📍 Test 2: Shape Clustering Optimization');
  
  // Run optimization with shapeClustered preset
  const result = optimizeWithPreset(testGrid, testTiles, 'shapeClustered');
  
  console.log(`Optimization completed:`);
  console.log(`- Swaps made: ${result.swaps}`);
  console.log(`- Iterations: ${result.iterations}`);
  console.log(`- Execution time: ${result.executionTime.toFixed(2)}ms`);
  console.log(`- Traversal used: ${result.config.traversal}`);
  console.log(`- Shape cluster weight: ${result.config.weights.shapeCluster}`);
  
  // Test 3: Verify shape grouping
  console.log('\n📍 Test 3: Shape Grouping Analysis');
  
  // Count shape clusters in 2x2 blocks
  const blockAnalysis: Array<{block: number, shapes: string[]}> = [];
  let blockId = 0;
  
  for (let blockRow = 0; blockRow < 8; blockRow += 2) {
    for (let blockCol = 0; blockCol < 12; blockCol += 2) {
      const blockShapes: string[] = [];
      
      for (let r = blockRow; r < Math.min(blockRow + 2, 8); r++) {
        for (let c = blockCol; c < Math.min(blockCol + 2, 12); c++) {
          const pos = r * 12 + c;
          const tile = result.grid[pos]?.tile;
          if (tile) {
            blockShapes.push(tile.shape);
          }
        }
      }
      
      blockAnalysis.push({ block: blockId++, shapes: blockShapes });
    }
  }
  
  // Count blocks with matching shapes
  let perfectBlocks = 0;
  let partialBlocks = 0;
  
  blockAnalysis.forEach(block => {
    const uniqueShapes = new Set(block.shapes);
    if (uniqueShapes.size === 1 && block.shapes.length > 0) {
      perfectBlocks++;
      console.log(`✨ Block ${block.block}: Perfect match - all ${block.shapes[0]}`);
    } else if (uniqueShapes.size === 2) {
      partialBlocks++;
    }
  });
  
  console.log('\n📊 Results Summary:');
  console.log(`- Perfect 2x2 blocks (all same shape): ${perfectBlocks}/48`);
  console.log(`- Partial blocks (2 shapes): ${partialBlocks}/48`);
  console.log(`- Mixed blocks (3+ shapes): ${48 - perfectBlocks - partialBlocks}/48`);
  
  // Test 4: Compare with row-major
  console.log('\n📍 Test 4: Comparison with Row-Major');
  
  const rowMajorResult = optimizeWithPreset(testGrid, testTiles, 'classic');
  
  console.log('Row-Major optimization:');
  console.log(`- Swaps: ${rowMajorResult.swaps}`);
  console.log(`- Shape clustering score would be different`);
  
  return {
    traversalCorrect,
    perfectBlocks,
    optimizationResult: result
  };
}

// Export a function to run in console
export function runTest() {
  const results = test2x2BlockTraversal();
  
  console.log('\n' + '='.repeat(50));
  console.log('🎯 FINAL TEST RESULTS:');
  console.log('='.repeat(50));
  console.log(`Traversal Pattern: ${results.traversalCorrect ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Shape Clustering: ${results.perfectBlocks > 5 ? '✅ WORKING' : '⚠️ NEEDS REVIEW'}`);
  console.log(`Optimization: ${results.optimizationResult.swaps > 0 ? '✅ ACTIVE' : '❌ NO CHANGES'}`);
  
  return results;
}

// Add to window for easy console access
if (typeof window !== 'undefined') {
  (window as any).test2x2Blocks = runTest;
  console.log('💡 Test ready! Run: test2x2Blocks()');
}