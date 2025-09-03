# AI Function Reference

## Clean AI Interface - Only Essential Functions

### Available Functions for AI

The AI can call **exactly 2 functions** through `AIPatternFunctions.executeFunction()`:

#### 1. `fillGrid`
- **Purpose**: Fill grid with all 96 tiles, each used exactly once
- **Usage**: `await executeFunction('fillGrid')`
- **What it does**: 
  - Fills empty cells with unused tiles from allTiles array
  - Ensures 1-1 mapping (no duplicates)
  - Returns count of tiles placed

#### 2. `optimizeEdgeMatching` 
- **Purpose**: Optimize tile placement for beautiful edge patterns using reference algorithm
- **Usage**: `await executeFunction('optimizeEdgeMatching')`
- **What it does**:
  - Uses exact algorithm from reference commit 94b7d2cb7c066335e7b8c743ea1ebc55c473315d
  - Scores tiles: Mirror (100) + Rotation (50) + Edge matches (10 each)
  - Processes left-to-right, top-to-bottom
  - Swaps tiles to optimize edge color matching

### File Structure (Cleaned)

```
src/components/
├── CoreFunctions.tsx          (Core logic - fillGrid, optimizeEdgeMatching)
├── AIPatternFunctions.tsx     (AI interface - 100 lines, 2 functions only)
├── MainGridEnhanced.tsx       (UI with 2 purple buttons)
└── [other UI components]      (unchanged)
```

### Removed Files
- ✅ `PatternFunctionPanel.tsx` (deleted - was unused popup)
- ✅ `PatternFunctionPopup.tsx` (deleted - replaced with inline buttons)
- ✅ All complex function variants (shuffleGrid, rotateAllTiles, etc.)

### AI Usage Example

```javascript
// AI can call these functions:
const result1 = await aiPatternFunctions.executeFunction('fillGrid');
const result2 = await aiPatternFunctions.executeFunction('optimizeEdgeMatching');

// Get available functions:
const functions = aiPatternFunctions.getAvailableFunctions();
// Returns: [{name: 'fillGrid', description: '...'}, {name: 'optimizeEdgeMatching', description: '...'}]
```

### User UI
- Two purple buttons above the grid:
  - 📦 **Fill All Tiles** 
  - 🎨 **Optimize Edge Matching**
- Functions work identically for both AI and user calls

### Benefits of Cleanup
- **Simple**: Only 2 functions instead of 15+
- **Focused**: AI can only call essential pattern functions
- **Clean**: No unused code or complex variants
- **Working**: Both functions use proven algorithms
- **Maintainable**: 100 lines instead of 600+ lines

The AI interface is now minimal and focused on the core pattern generation tasks.