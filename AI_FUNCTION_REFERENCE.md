# AI Function Reference

## Clean AI Interface - Essential + Recursive Functions

### Available Functions for AI

The AI can call **exactly 5 functions** through `AIPatternFunctions.executeFunction()`:

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

#### 3. `findMirrorTile`
- **Purpose**: Find mirror tile for tile at specified position using CSV relationships
- **Usage**: `await executeFunction('findMirrorTile', { position: 36, direction: 'horizontal', place: true })`
- **Parameters**:
  - `position`: Grid position (0-95)
  - `direction`: 'horizontal' or 'vertical'
  - `place`: (optional) Whether to place mirror tile adjacent
- **What it does**:
  - Uses Mirror-H/Mirror-V data from CSV to find exact mirror tile
  - Can optionally place the mirror tile in adjacent position
  - Builds tile-by-tile recursive relationships

#### 4. `findRotationFamily`
- **Purpose**: Find all rotation variants of tile (same shape family)
- **Usage**: `await executeFunction('findRotationFamily', { position: 36 })`
- **Parameters**:
  - `position`: Grid position (0-95)
- **What it does**:
  - Uses Shape column from CSV to group tiles by family
  - Returns all rotation variants of the current tile
  - Enables recursive rotation-based patterns

#### 5. `findEdgeMatches`
- **Purpose**: Find tiles with matching edge colors for seamless connections
- **Usage**: `await executeFunction('findEdgeMatches', { position: 36, direction: 'north' })`
- **Parameters**:
  - `position`: Grid position (0-95)
  - `direction`: 'north', 'south', 'east', or 'west'
- **What it does**:
  - Uses edge-S/W/N/E data from CSV to find compatible tiles
  - Returns tiles where opposite edge matches current tile's edge
  - Enables recursive edge-flow patterns

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

### AI Usage Examples

```javascript
// Essential functions:
const result1 = await aiPatternFunctions.executeFunction('fillGrid');
const result2 = await aiPatternFunctions.executeFunction('optimizeEdgeMatching');

// Recursive relationship functions:
const result3 = await aiPatternFunctions.executeFunction('findMirrorTile', {
  position: 36, // center of 12x8 grid
  direction: 'horizontal',
  place: true // place the mirror tile adjacent
});

const result4 = await aiPatternFunctions.executeFunction('findRotationFamily', {
  position: 12 // find all rotation variants
});

const result5 = await aiPatternFunctions.executeFunction('findEdgeMatches', {
  position: 24,
  direction: 'north' // find tiles that match north edge
});

// Get available functions:
const functions = aiPatternFunctions.getAvailableFunctions();
// Returns: 5 functions with descriptions
```

### Recursive Pattern Building Strategy

1. **Start with one tile**: Use `fillGrid` to place all tiles randomly
2. **Analyze relationships**: Use `findMirrorTile`, `findRotationFamily`, `findEdgeMatches` to discover connections
3. **Build patterns recursively**: 
   - Find a tile's mirror → place it → find mirror's edge matches → continue chain
   - Find rotation family → place them in symmetric positions → find their mirrors
   - Follow edge matches to create flowing color connections
4. **Optimize**: Use `optimizeEdgeMatching` to refine the final pattern

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