# AI Edge Matching Flow Documentation

## Overview
This document explains how the AI chat system executes the Beautiful Edge Matching algorithm and processes the first 3 tiles step-by-step.

## System Architecture

```
User Message → AI Chat API → Claude Response → Function Parser → Edge Matching Algorithm → Grid Update → Visual Render
```

## Complete Call Flow

### 1. User Interaction
```typescript
User types: "Create a beautiful pattern"
↓
AIPatternChatPopup.handleSend()
```

### 2. API Request
```typescript
fetch('/api/ai-chat', {
  method: 'POST',
  body: JSON.stringify({
    messages: [...chatHistory, userMessage],
    availableFunctions: [
      {name: 'createBeautifulPattern', description: 'Run complete algorithm'},
      {name: 'optimizeEdgeMatching', description: 'Smart tile placement'},
      {name: 'buildLateralEdges', description: 'Horizontal chains'},
      {name: 'buildBottomEdges', description: 'Vertical chains'}
    ]
  })
})
```

### 3. Claude API Processing
```typescript
// In api/ai-chat/route.ts
Claude receives system prompt:
"You can call functions by responding with: CALL_FUNCTION: functionName with {args}"

Claude responds:
"I'll create a beautiful pattern using edge matching...
CALL_FUNCTION: createBeautifulPattern with {}"
```

### 4. Function Call Parsing
```typescript
// Back in AIPatternChatPopup
const functionCalls = parseResponse(claudeResponse);
// Result: [{name: 'createBeautifulPattern', arguments: {}}]

for (const funcCall of functionCalls) {
  const result = await executeFunction(funcCall.name, funcCall.arguments);
}
```

### 5. Function Execution
```typescript
// AIPatternFunctions.executeFunction()
switch(functionName) {
  case 'createBeautifulPattern':
    return this.createBeautifulPattern();
}

// BeautifulEdgeMatching.createBeautifulPattern()
async createBeautifulPattern() {
  const step1 = this.optimizeEdgeMatching();     // Score-based placement
  const step2 = this.buildLateralEdges();       // Horizontal chains  
  const step3 = this.buildBottomEdges();        // Vertical chains
  
  this.onGridUpdate([...this.grid]);            // Trigger React re-render
  return "Beautiful pattern complete!";
}
```

## First 3 Tiles Step-by-Step Process

### Tile Processing Flow

#### **Step 1: Optimize Edge Matching (First Pass)**
```typescript
optimizeEdgeMatching() {
  // For each occupied position, find better placement
  for (let targetPos = 0; targetPos < grid.length; targetPos++) {
    if (!grid[targetPos].tile) continue;
    
    let bestScore = -1;
    let bestPosition = null;
    
    // Try swapping with all other tiles
    for (let searchPos = 0; searchPos < grid.length; searchPos++) {
      // Score this potential swap
      const score = calculateEdgeMatchScore(targetPos, searchPos);
      if (score > bestScore) {
        bestScore = score;
        bestPosition = searchPos;
      }
    }
    
    // Perform best swap found
    if (bestPosition !== null) {
      swapTiles(targetPos, bestPosition);
    }
  }
}
```

#### **Step 2: Build Lateral Edges (Horizontal Chains)**

**Processing Tile 0 (Position 0,0):**
```
Grid Position: 0 (Row 0, Col 0)
Current Tile: tile_001 with edges [a,b,c,a]
Target: Find tile for position 1 that matches right edge 'b'

1. Get anchor tile edge signature:
   - Tile at pos 0: right edge = 'b'
   - Need neighbor with left edge = 'b'
   - Two-segment signature needed: "b-?" (where ? can be any color)

2. Search for matching tile:
   for (searchPos = 2; searchPos < 96; searchPos++) {
     candidate = grid[searchPos]
     if (candidate.edges.left === 'b') {
       foundMatch = searchPos
       break
     }
   }

3. Move matching tile:
   shiftRowRightSegment(foundPos=5, targetPos=1)
   // Shifts tiles 1→2→3→4→5 becomes 5→1→2→3→4
```

**Processing Tile 1 (Position 0,1):**
```
Grid Position: 1 (Row 0, Col 1) 
New Tile: tile_023 with edges [b,c,a,b] (moved from pos 5)
Target: Find tile for position 2 that matches right edge 'c'

1. Anchor analysis:
   - Current tile right edge = 'c'
   - Need signature: "c-?" for position 2

2. Search pattern:
   - Look in same row first (positions 3-11)
   - Then search entire grid
   - Find tile with left edge = 'c'

3. Execute move:
   foundTile = tile_087 at position 8
   shiftRowRightSegment(8, 2)
```

**Processing Tile 2 (Position 0,2):**
```
Grid Position: 2 (Row 0, Col 2)
New Tile: tile_087 with edges [c,a,b,c]
Target: Continue chain to position 3

1. Edge signature analysis:
   - Right edge = 'a' 
   - Two-segment signature: "a-b" (current + next needed)
   - Search for tile with signature matching "a-?"

2. Chain building logic:
   if (position_2_right === position_3_left) {
     // Already matches - skip
     continue;
   } else {
     // Find and move matching tile
     searchForSignature("a-b");
   }

3. Pattern continuation:
   - This process repeats for all 12 tiles in row 0
   - Then moves to row 1, building on established patterns
```

#### **Step 3: Build Bottom Edges (Vertical Chains)**

After lateral chains, vertical connections:

```typescript
buildBottomEdges() {
  for (let col = 0; col < 12; col++) {
    for (let row = 0; row < 7; row++) {  // 7 rows of connections
      const anchorPos = row * 12 + col;
      const neighborPos = (row + 1) * 12 + col;
      
      // Get bottom edge of anchor tile
      const anchorSig = getTileEdgeSignatures(anchorPos);
      const needSig = anchorSig.bottom; // e.g. "a-c"
      
      // Find tile with matching top edge
      for (let searchPos = neighborPos + 12; searchPos < 96; searchPos++) {
        const candidateSig = getTileEdgeSignatures(searchPos);
        if (candidateSig.top === needSig) {
          shiftColumnUpSegment(searchPos, neighborPos);
          break;
        }
      }
    }
  }
}
```

## Edge Signature System

The algorithm uses **two-segment edge signatures**:

```typescript
// For a tile with edges [a, b, c, a]:
signatures = {
  top: "a-c",     // top + bottom edges
  right: "b-a",   // right + left edges  
  bottom: "c-a",  // bottom + top edges
  left: "a-b"     // left + right edges
}

// Normalization ensures consistent matching:
normalizeEdge("a", "c") → "a-c"  // alphabetical order
normalizeEdge("c", "a") → "a-c"  // same result
```

## Visual Result

After processing first 3 tiles:
```
[tile_001] → [tile_023] → [tile_087] → ...
   a-b-a      b-c-a-b      c-a-b-c
   
Connected edges:
Position 0→1: right 'b' matches left 'b' ✓
Position 1→2: right 'c' matches left 'c' ✓
Position 2→3: right 'a' matches left 'a' ✓
```

## Function Call Summary

```
User: "Create pattern"
↓
AI: CALL_FUNCTION: createBeautifulPattern
↓
BeautifulEdgeMatching.createBeautifulPattern()
  ├── optimizeEdgeMatching() - Improves initial placement
  ├── buildLateralEdges()    - Creates horizontal connections
  └── buildBottomEdges()     - Creates vertical connections
↓
onGridUpdate([...grid])      - Triggers React re-render
↓
Visual grid updates with new tile positions
```

## Current Issues

1. **Limited tile variety** - Algorithm can't find enough matching signatures
2. **Fallback needed** - Should use partial matches when exact ones fail
3. **Performance** - Needs optimization for 96 tiles

## Next Steps

1. Improve tile diversity in initial grid
2. Add partial matching fallback
3. Create more flexible signature matching
4. Add visual feedback for each step