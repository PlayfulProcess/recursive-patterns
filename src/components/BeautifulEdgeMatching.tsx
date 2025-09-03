// Beautiful Edge Matching Algorithm - Exact adaptation from reference commit 94b7d2c
// This creates the beautiful patterns by building lateral and vertical chains

import { TileData } from './CSVTable';

interface GridCell {
  x: number;
  y: number;
  tile?: TileData;
  rotation?: number;
}

interface EdgeColors {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

export class BeautifulEdgeMatching {
  constructor(
    private grid: GridCell[],
    private allTiles: TileData[],
    private onGridUpdate: (newGrid: GridCell[]) => void,
    private gridWidth: number = 12,
    private gridHeight: number = 8
  ) {}

  // Get tile edge colors - adapted from reference getTileEdgeColors function
  private getTileEdgeColors(position: number): EdgeColors {
    if (position < 0 || position >= this.grid.length) {
      return { top: '', right: '', bottom: '', left: '' };
    }

    const cell = this.grid[position];
    if (!cell.tile) {
      return { top: '', right: '', bottom: '', left: '' };
    }

    const tile = cell.tile;
    const rotation = Math.floor((cell.rotation || 0) / 90);
    
    // Base edge signatures as two-part [cA, cB] for rotation 0
    // Our tile structure: left triangle (edge1), top-right (edge2), bottom-right (edge3)
    let baseEdges = {
      top: [tile.edge2, tile.edge2],    // Top edge: uniform color from top-right triangle
      right: [tile.edge3, tile.edge3],  // Right edge: uniform color from bottom-right triangle  
      bottom: [tile.edge1, tile.edge3], // Bottom edge: left half from left triangle, right half from bottom-right
      left: [tile.edge1, tile.edge1]    // Left edge: uniform color from left triangle
    };
    
    // Apply rotation
    for (let r = 0; r < rotation; r++) {
      // Rotate edges clockwise
      const temp = baseEdges.top;
      baseEdges.top = baseEdges.left;
      baseEdges.left = baseEdges.bottom;
      baseEdges.bottom = baseEdges.right;
      baseEdges.right = temp;
    }
    
    // Convert to string signatures for matching
    return {
      top: baseEdges.top.join('-'),
      right: baseEdges.right.join('-'),
      bottom: baseEdges.bottom.join('-'),
      left: baseEdges.left.join('-')
    };
  }

  // Helper to shift tiles within a row segment (exact match of reference)
  private shiftRowLeftSegment(fromPos: number, toPos: number): void {
    if (fromPos === toPos) return;
    
    const fromRow = Math.floor(fromPos / this.gridWidth);
    const toRow = Math.floor(toPos / this.gridWidth);
    
    // If tiles are in different rows, just swap
    if (fromRow !== toRow) {
      this.swapTiles(fromPos, toPos);
      return;
    }
    
    // Same row - shift the segment
    const tileToMove = { ...this.grid[fromPos] };
    
    if (fromPos > toPos) {
      // Moving left - shift segment right to make space
      for (let i = fromPos; i > toPos; i--) {
        this.grid[i] = { ...this.grid[i], tile: this.grid[i - 1].tile, rotation: this.grid[i - 1].rotation };
      }
    } else {
      // Moving right - shift segment left to make space
      for (let i = fromPos; i < toPos; i++) {
        this.grid[i] = { ...this.grid[i], tile: this.grid[i + 1].tile, rotation: this.grid[i + 1].rotation };
      }
    }
    
    this.grid[toPos] = { ...this.grid[toPos], tile: tileToMove.tile, rotation: tileToMove.rotation };
  }

  // Helper to shift tiles within a column segment (exact match of reference)
  private shiftColumnUpSegment(fromPos: number, toPos: number): void {
    if (fromPos === toPos) return;
    
    const fromCol = fromPos % this.gridWidth;
    const toCol = toPos % this.gridWidth;
    
    // If tiles are in different columns, just swap
    if (fromCol !== toCol) {
      this.swapTiles(fromPos, toPos);
      return;
    }
    
    // Same column - shift the segment
    const tileToMove = { ...this.grid[fromPos] };
    
    if (fromPos > toPos) {
      // Moving up - shift segment down to make space
      for (let i = fromPos; i > toPos; i -= this.gridWidth) {
        this.grid[i] = { ...this.grid[i], tile: this.grid[i - this.gridWidth].tile, rotation: this.grid[i - this.gridWidth].rotation };
      }
    } else {
      // Moving down - shift segment up to make space
      for (let i = fromPos; i < toPos; i += this.gridWidth) {
        this.grid[i] = { ...this.grid[i], tile: this.grid[i + this.gridWidth].tile, rotation: this.grid[i + this.gridWidth].rotation };
      }
    }
    
    this.grid[toPos] = { ...this.grid[toPos], tile: tileToMove.tile, rotation: tileToMove.rotation };
  }

  // Simple tile swap
  private swapTiles(pos1: number, pos2: number): void {
    const temp = { tile: this.grid[pos1].tile, rotation: this.grid[pos1].rotation };
    this.grid[pos1] = { ...this.grid[pos1], tile: this.grid[pos2].tile, rotation: this.grid[pos2].rotation };
    this.grid[pos2] = { ...this.grid[pos2], tile: temp.tile, rotation: temp.rotation };
  }

  // Calculate edge match score - exact match of reference function
  private calculateEdgeMatchScore(tilePos: number, targetPos: number, row: number, col: number): number {
    const tileColors = this.getTileEdgeColors(tilePos);
    let score = 0;
    
    // Check left neighbor (if not first column)
    if (col > 0) {
      const leftPos = targetPos - 1;
      const leftColors = this.getTileEdgeColors(leftPos);
      if (leftColors.right === tileColors.left) {
        score += 2; // High priority for horizontal matching
      }
    }
    
    // Check top neighbor (if not first row)
    if (row > 0) {
      const topPos = targetPos - this.gridWidth;
      const topColors = this.getTileEdgeColors(topPos);
      if (topColors.bottom === tileColors.top) {
        score += 2; // High priority for vertical matching
      }
    }
    
    // Check right neighbor (if exists and already placed)
    if (col < this.gridWidth - 1) {
      const rightPos = targetPos + 1;
      if (rightPos < this.grid.length) {
        const rightColors = this.getTileEdgeColors(rightPos);
        if (rightColors.left === tileColors.right) {
          score += 1;
        }
      }
    }
    
    // Check bottom neighbor (if exists and already placed)
    if (row < this.gridHeight - 1) {
      const bottomPos = targetPos + this.gridWidth;
      if (bottomPos < this.grid.length) {
        const bottomColors = this.getTileEdgeColors(bottomPos);
        if (bottomColors.top === tileColors.bottom) {
          score += 1;
        }
      }
    }
    
    return score;
  }

  // Find best tile for position - exact match of reference function
  private findBestTileForPosition(targetPos: number, row: number, col: number, used: Set<number>): number | null {
    let bestScore = -1;
    let bestTilePos = null;
    
    // Check all unused positions
    for (let pos = 0; pos < this.grid.length; pos++) {
      if (used.has(pos)) continue;
      
      const score = this.calculateEdgeMatchScore(pos, targetPos, row, col);
      if (score > bestScore) {
        bestScore = score;
        bestTilePos = pos;
      }
    }
    
    return bestTilePos;
  }

  // 1. OPTIMIZE EDGE MATCHING - exact match of reference function
  public optimizeEdgeMatching(): string {
    console.log('🎨 Starting edge matching optimization...');
    
    const used = new Set<number>();
    let totalSwaps = 0;
    
    // Start from top-left (0,0)
    for (let row = 0; row < this.gridHeight; row++) {
      for (let col = 0; col < this.gridWidth; col++) {
        const currentPos = row * this.gridWidth + col;
        
        if (currentPos >= this.grid.length) break;
        
        // Find the best tile for this position
        const bestTile = this.findBestTileForPosition(currentPos, row, col, used);
        
        if (bestTile !== null && bestTile !== currentPos) {
          // Swap the best tile to current position
          this.swapTiles(currentPos, bestTile);
          totalSwaps++;
        }
        
        // Mark current position as used
        used.add(currentPos);
      }
    }
    
    this.onGridUpdate([...this.grid]);
    console.log('🎨 Edge matching complete - tiles connected by color');
    return `Edge matching complete - tiles connected by color (${totalSwaps} optimizations)`;
  }

  // 2. BUILD LATERAL EDGES - exact match of reference function
  public buildLateralEdges(): string {
    console.log('→ Building lateral chains...');
    
    let totalMatches = 0;
    
    // Process each row, building horizontal chains
    for (let row = 0; row < this.gridHeight; row++) {
      const startPos = row * this.gridWidth;
      if (startPos >= this.grid.length) break;
      
      // Grow chain across the entire row
      const rowMatches = this.growRowChain(startPos);
      totalMatches += rowMatches;
    }
    
    this.onGridUpdate([...this.grid]);
    console.log(`→ Lateral chains complete - ${totalMatches} horizontal connections made`);
    return `Lateral chains complete - ${totalMatches} horizontal connections made`;
  }

  // Grow row chain - exact match of reference function
  private growRowChain(startPos: number): number {
    let matches = 0;
    const row = Math.floor(startPos / this.gridWidth);
    const rowStart = row * this.gridWidth;
    const rowEnd = Math.min(rowStart + this.gridWidth, this.grid.length);
    
    console.log(`→ Processing row ${row} (positions ${rowStart} to ${rowEnd-1})`);
    
    // Scan left-to-right through the row
    for (let anchorPos = rowStart; anchorPos < rowEnd - 1; anchorPos++) {
      const neighborPos = anchorPos + 1;
      
      // Get edge signatures for anchor and current neighbor
      const anchorEdges = this.getTileEdgeColors(anchorPos);
      const neighborEdges = this.getTileEdgeColors(neighborPos);
      const needSig = anchorEdges.right;
      
      // Check if current neighbor already matches
      if (neighborEdges.left === needSig) {
        console.log(`  ✓ Position ${anchorPos} already matches neighbor ${neighborPos}`);
        continue;
      }
      
      // Search for matching tile, first in row, then in grid
      let foundPos: number | null = null;
      
      // Search in row first
      for (let searchPos = neighborPos + 1; searchPos < rowEnd; searchPos++) {
        const candidateEdges = this.getTileEdgeColors(searchPos);
        if (candidateEdges.left === needSig) {
          foundPos = searchPos;
          console.log(`  → Found row match at ${searchPos} for anchor ${anchorPos}`);
          break;
        }
      }
      
      // If not found in row, search in entire grid
      if (foundPos === null) {
        for (let searchPos = 0; searchPos < this.grid.length; searchPos++) {
          if (searchPos >= rowStart && searchPos < rowEnd) continue; // Skip current row
          const candidateEdges = this.getTileEdgeColors(searchPos);
          if (candidateEdges.left === needSig) {
            foundPos = searchPos;
            console.log(`  → Found grid match at ${searchPos} for anchor ${anchorPos}`);
            break;
          }
        }
      }
      
      // Move matching tile to neighbor position or skip
      if (foundPos !== null) {
        this.shiftRowLeftSegment(foundPos, neighborPos);
        matches++;
        console.log(`  ✓ Moved tile from ${foundPos} to ${neighborPos}`);
      } else {
        console.log(`  ⚠ No match found for anchor ${anchorPos}, skipping`);
      }
    }
    
    console.log(`← Row ${row} complete: ${matches} matches made`);
    return matches;
  }

  // 3. BUILD BOTTOM EDGES - exact match of reference function  
  public buildBottomEdges(): string {
    console.log('↓ Building vertical chains...');
    
    let totalMatches = 0;
    
    // Process each column, building vertical chains
    for (let col = 0; col < this.gridWidth; col++) {
      if (col >= this.grid.length) break;
      
      // Grow chain down the entire column
      const colMatches = this.growColChain(col);
      totalMatches += colMatches;
    }
    
    this.onGridUpdate([...this.grid]);
    console.log(`↓ Vertical chains complete - ${totalMatches} vertical connections made`);
    return `Vertical chains complete - ${totalMatches} vertical connections made`;
  }

  // Grow column chain - exact match of reference function
  private growColChain(startCol: number): number {
    let matches = 0;
    
    console.log(`↓ Processing column ${startCol} (${this.gridHeight} rows)`);
    
    // Scan top-to-bottom through the column
    for (let row = 0; row < this.gridHeight - 1; row++) {
      const anchorPos = row * this.gridWidth + startCol;
      const neighborPos = anchorPos + this.gridWidth;
      
      // Skip if positions are out of bounds
      if (anchorPos >= this.grid.length || neighborPos >= this.grid.length) continue;
      
      // Get edge signatures for anchor and current neighbor
      const anchorEdges = this.getTileEdgeColors(anchorPos);
      const neighborEdges = this.getTileEdgeColors(neighborPos);
      const needSig = anchorEdges.bottom;
      
      // Check if current neighbor already matches
      if (neighborEdges.top === needSig) {
        console.log(`  ✓ Position ${anchorPos} already matches neighbor ${neighborPos}`);
        continue;
      }
      
      // Search for matching tile, first in column, then in grid
      let foundPos: number | null = null;
      
      // Search down the column first
      for (let searchRow = row + 2; searchRow < this.gridHeight; searchRow++) {
        const searchPos = searchRow * this.gridWidth + startCol;
        if (searchPos >= this.grid.length) break;
        
        const candidateEdges = this.getTileEdgeColors(searchPos);
        if (candidateEdges.top === needSig) {
          foundPos = searchPos;
          console.log(`  ↓ Found column match at ${searchPos} for anchor ${anchorPos}`);
          break;
        }
      }
      
      // If not found in column, search in entire grid
      if (foundPos === null) {
        for (let searchPos = 0; searchPos < this.grid.length; searchPos++) {
          // Skip current column
          if (Math.floor((searchPos % this.gridWidth)) === startCol) continue;
          
          const candidateEdges = this.getTileEdgeColors(searchPos);
          if (candidateEdges.top === needSig) {
            foundPos = searchPos;
            console.log(`  ↓ Found grid match at ${searchPos} for anchor ${anchorPos}`);
            break;
          }
        }
      }
      
      // Move matching tile to neighbor position or skip
      if (foundPos !== null) {
        this.shiftColumnUpSegment(foundPos, neighborPos);
        matches++;
        console.log(`  ✓ Moved tile from ${foundPos} to ${neighborPos}`);
      } else {
        console.log(`  ⚠ No match found for anchor ${anchorPos}, skipping`);
      }
    }
    
    console.log(`↑ Column ${startCol} complete: ${matches} matches made`);
    return matches;
  }

  // LOGGING HELPER - Print edge signatures for debugging  
  public logEdgeSignatures(): string {
    console.log('🔍 Edge Signatures Debug Info:');
    
    for (let row = 0; row < this.gridHeight; row++) {
      const rowSigs: string[] = [];
      
      for (let col = 0; col < this.gridWidth; col++) {
        const pos = row * this.gridWidth + col;
        if (pos >= this.grid.length || !this.grid[pos].tile) {
          rowSigs.push('empty');
          continue;
        }
        
        const colors = this.getTileEdgeColors(pos);
        rowSigs.push(`${pos}:T${colors.top}|R${colors.right}|B${colors.bottom}|L${colors.left}`);
      }
      
      console.log(`Row ${row}: ${rowSigs.join(' | ')}`);
    }
    
    return 'Edge signatures logged to console';
  }

  // 4. COMPLETE PATTERN - combines all three functions sequentially
  public createBeautifulPattern(): string {
    console.log('🌟 Creating beautiful pattern with full algorithm...');
    
    const results: string[] = [];
    
    // Step 1: Optimize edge matching (smart placement)
    results.push(this.optimizeEdgeMatching());
    
    // Step 2: Build lateral chains (horizontal flow)
    results.push(this.buildLateralEdges());
    
    // Step 3: Build vertical chains (vertical flow)  
    results.push(this.buildBottomEdges());
    
    console.log('🌟 Beautiful pattern complete!');
    return `Beautiful pattern complete! ✨\n\n${results.join('\n\n')}`;
  }
}