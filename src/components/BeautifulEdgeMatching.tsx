// Beautiful Edge Matching Algorithm - Adapted from commit 94b7d2c
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

interface EdgeSignature {
  top: string;    // normalized "a-b" format
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

  // Normalize edge signature to "a-b" format where order doesn't matter
  private normalizeEdge(c1: string, c2: string): string {
    return c1 <= c2 ? `${c1}-${c2}` : `${c2}-${c1}`;
  }

  // Get two-segment edge signatures for a tile (follows CLAUDE.md specification)
  private getTileEdgeSignatures(position: number): EdgeSignature {
    if (position < 0 || position >= this.grid.length) {
      return { top: '', right: '', bottom: '', left: '' };
    }

    const cell = this.grid[position];
    if (!cell.tile) {
      return { top: '', right: '', bottom: '', left: '' };
    }

    const tile = cell.tile;
    const rotation = cell.rotation || 0;
    
    // Base two-segment edges (rotation 0): 
    // top=[c2,c2], right=[c3,c3], bottom=[c1,c3], left=[c1,c1]
    let edges = [
      this.normalizeEdge(tile.edge2, tile.edge2), // top
      this.normalizeEdge(tile.edge3, tile.edge3), // right  
      this.normalizeEdge(tile.edge1, tile.edge3), // bottom
      this.normalizeEdge(tile.edge1, tile.edge1)  // left
    ];
    
    // Rotate edges based on rotation (clockwise)
    for (let i = 0; i < rotation; i++) {
      edges = [edges[3], edges[0], edges[1], edges[2]]; // Rotate clockwise
    }
    
    return {
      top: edges[0],
      right: edges[1], 
      bottom: edges[2],
      left: edges[3]
    };
  }

  // Get edge colors for a tile at a position (adapts original edgesForMeta function)
  private getTileEdgeColors(position: number): EdgeColors {
    if (position < 0 || position >= this.grid.length) {
      return { top: '', right: '', bottom: '', left: '' };
    }

    const cell = this.grid[position];
    if (!cell.tile) {
      return { top: '', right: '', bottom: '', left: '' };
    }

    const tile = cell.tile;
    const rotation = cell.rotation || 0;
    
    // Base edges (rotation 0): [top, right, bottom, left]
    let edges = [tile.edge1, tile.edge4, tile.edge3, tile.edge2]; // S, E, N, W -> T, R, B, L
    
    // Rotate edges based on rotation (clockwise)
    for (let i = 0; i < rotation; i++) {
      edges = [edges[3], edges[0], edges[1], edges[2]]; // Rotate clockwise
    }
    
    return {
      top: edges[0],
      right: edges[1], 
      bottom: edges[2],
      left: edges[3]
    };
  }

  // Helper to shift tiles within a row segment (preserves order)
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
    const tileToMove = this.grid[fromPos];
    
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

  // Helper to shift tiles within a column segment
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
    const tileToMove = this.grid[fromPos];
    
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

  // Find best tile for a position (score-based optimization)
  private findBestTileForPosition(targetPos: number, used: Set<number>): number | null {
    let bestScore = -1;
    let bestPosition = null;
    
    const targetX = targetPos % this.gridWidth;
    const targetY = Math.floor(targetPos / this.gridWidth);
    
    // Try all unused positions
    for (let searchPos = 0; searchPos < this.grid.length; searchPos++) {
      if (used.has(searchPos) || !this.grid[searchPos].tile) continue;
      
      let score = 0;
      const testGrid = [...this.grid];
      
      // Temporarily place tile at target position
      testGrid[targetPos] = { ...testGrid[targetPos], tile: this.grid[searchPos].tile, rotation: this.grid[searchPos].rotation };
      
      // Score based on edge matches with neighbors
      const edges = this.getTileEdgeColors(targetPos);
      
      // Check top neighbor
      if (targetY > 0) {
        const topPos = (targetY - 1) * this.gridWidth + targetX;
        const topEdges = this.getTileEdgeColors(topPos);
        if (topEdges.bottom === edges.top) score++;
      }
      
      // Check right neighbor
      if (targetX < this.gridWidth - 1) {
        const rightPos = targetY * this.gridWidth + (targetX + 1);
        const rightEdges = this.getTileEdgeColors(rightPos);
        if (rightEdges.left === edges.right) score++;
      }
      
      // Check bottom neighbor
      if (targetY < this.gridHeight - 1) {
        const bottomPos = (targetY + 1) * this.gridWidth + targetX;
        const bottomEdges = this.getTileEdgeColors(bottomPos);
        if (bottomEdges.top === edges.bottom) score++;
      }
      
      // Check left neighbor
      if (targetX > 0) {
        const leftPos = targetY * this.gridWidth + (targetX - 1);
        const leftEdges = this.getTileEdgeColors(leftPos);
        if (leftEdges.right === edges.left) score++;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestPosition = searchPos;
      }
    }
    
    return bestPosition;
  }

  // 1. OPTIMIZE EDGE MATCHING - Smart tile placement
  public optimizeEdgeMatching(): string {
    console.log('🎨 Starting edge matching optimization...');
    
    const used = new Set<number>();
    let totalSwaps = 0;
    
    // Start from top-left, go position by position
    for (let row = 0; row < this.gridHeight; row++) {
      for (let col = 0; col < this.gridWidth; col++) {
        const currentPos = row * this.gridWidth + col;
        
        if (currentPos >= this.grid.length) break;
        
        // Find the best tile for this position
        const bestTilePos = this.findBestTileForPosition(currentPos, used);
        
        if (bestTilePos !== null && bestTilePos !== currentPos) {
          // Swap the best tile to current position
          this.swapTiles(currentPos, bestTilePos);
          totalSwaps++;
          console.log(`  ✓ Swapped positions ${currentPos} ↔ ${bestTilePos}`);
        }
        
        // Mark current position as used
        used.add(currentPos);
      }
    }
    
    this.onGridUpdate([...this.grid]);
    console.log(`🎨 Edge optimization complete: ${totalSwaps} improvements made`);
    return `Edge optimization complete! Made ${totalSwaps} strategic tile placements for better color flow.`;
  }

  // 2. BUILD LATERAL EDGES - Horizontal chain building with skip (improved)
  public buildLateralEdges(): string {
    console.log('→ Starting lateral chain building with skip...');
    
    let totalMatches = 0;
    
    // Process each row, building horizontal chains
    for (let row = 0; row < this.gridHeight; row++) {
      const rowStart = row * this.gridWidth;
      const rowEnd = Math.min(rowStart + this.gridWidth, this.grid.length);
      
      console.log(`→ Processing row ${row} (positions ${rowStart} to ${rowEnd-1})`);
      
      // Scan left-to-right through the row
      for (let anchorPos = rowStart; anchorPos < rowEnd - 1; anchorPos++) {
        const neighborPos = anchorPos + 1;
        
        // Get edge signatures using two-segment model
        const anchorEdges = this.getTileEdgeSignatures(anchorPos);
        const neighborEdges = this.getTileEdgeSignatures(neighborPos);
        const needSig = anchorEdges.right; // anchor's right edge signature
        
        // Check if current neighbor already matches
        if (neighborEdges.left === needSig) {
          console.log(`  ✓ Position ${anchorPos} already matches neighbor ${neighborPos} (${needSig})`);
          continue;
        }
        
        // Search for matching tile, first in row, then in grid
        let foundPos: number | null = null;
        
        // Search in row first (searchScope='row')
        for (let searchPos = neighborPos + 1; searchPos < rowEnd; searchPos++) {
          const candidateEdges = this.getTileEdgeSignatures(searchPos);
          if (candidateEdges.left === needSig) {
            foundPos = searchPos;
            console.log(`  → Found row match at ${searchPos} for anchor ${anchorPos} (${needSig})`);
            break;
          }
        }
        
        // If not found in row, search in entire grid (searchScope='grid')
        if (foundPos === null) {
          for (let searchPos = 0; searchPos < this.grid.length; searchPos++) {
            if (searchPos >= rowStart && searchPos < rowEnd) continue; // Skip current row
            const candidateEdges = this.getTileEdgeSignatures(searchPos);
            if (candidateEdges.left === needSig) {
              foundPos = searchPos;
              console.log(`  → Found grid match at ${searchPos} for anchor ${anchorPos} (${needSig})`);
              break;
            }
          }
        }
        
        // Move matching tile to neighbor position using shift (not swap)
        if (foundPos !== null) {
          this.shiftRowLeftSegment(foundPos, neighborPos);
          totalMatches++;
          console.log(`  ✓ Shifted tile from ${foundPos} to ${neighborPos}`);
        } else {
          console.log(`  ⚠ No match found for anchor ${anchorPos} (need ${needSig}), skipping to continue chain`);
          // Skip to next anchor - this is the "skip to the next always" behavior
        }
      }
      
      console.log(`← Row ${row} complete`);
    }
    
    this.onGridUpdate([...this.grid]);
    console.log(`→ Lateral chains complete: ${totalMatches} horizontal connections made`);
    return `Lateral chains complete! Built ${totalMatches} horizontal connections using two-segment edge matching.`;
  }

  // 3. BUILD BOTTOM EDGES - Vertical chain building with skip (improved)
  public buildBottomEdges(): string {
    console.log('↓ Starting vertical chain building with skip...');
    
    let totalMatches = 0;
    
    // Process each column, building vertical chains
    for (let col = 0; col < this.gridWidth; col++) {
      console.log(`↓ Processing column ${col}`);
      
      // Scan top-to-bottom through the column
      for (let row = 0; row < this.gridHeight - 1; row++) {
        const anchorPos = row * this.gridWidth + col;
        const neighborPos = anchorPos + this.gridWidth;
        
        // Skip if positions are out of bounds
        if (anchorPos >= this.grid.length || neighborPos >= this.grid.length) continue;
        
        // Get edge signatures using two-segment model
        const anchorEdges = this.getTileEdgeSignatures(anchorPos);
        const neighborEdges = this.getTileEdgeSignatures(neighborPos);
        const needSig = anchorEdges.bottom; // anchor's bottom edge signature
        
        // Check if current neighbor already matches
        if (neighborEdges.top === needSig) {
          console.log(`  ✓ Position ${anchorPos} already matches neighbor ${neighborPos} (${needSig})`);
          continue;
        }
        
        // Search for matching tile, first in column, then in grid
        let foundPos: number | null = null;
        
        // Search down the column first (searchScope='column')
        for (let searchRow = row + 2; searchRow < this.gridHeight; searchRow++) {
          const searchPos = searchRow * this.gridWidth + col;
          if (searchPos >= this.grid.length) break;
          
          const candidateEdges = this.getTileEdgeSignatures(searchPos);
          if (candidateEdges.top === needSig) {
            foundPos = searchPos;
            console.log(`  ↓ Found column match at ${searchPos} for anchor ${anchorPos} (${needSig})`);
            break;
          }
        }
        
        // If not found in column, search in entire grid (searchScope='grid')
        if (foundPos === null) {
          for (let searchPos = 0; searchPos < this.grid.length; searchPos++) {
            // Skip current column
            if (searchPos % this.gridWidth === col) continue;
            
            const candidateEdges = this.getTileEdgeSignatures(searchPos);
            if (candidateEdges.top === needSig) {
              foundPos = searchPos;
              console.log(`  ↓ Found grid match at ${searchPos} for anchor ${anchorPos} (${needSig})`);
              break;
            }
          }
        }
        
        // Move matching tile to neighbor position using shift (not swap)
        if (foundPos !== null) {
          this.shiftColumnUpSegment(foundPos, neighborPos);
          totalMatches++;
          console.log(`  ✓ Shifted tile from ${foundPos} to ${neighborPos}`);
        } else {
          console.log(`  ⚠ No match found for anchor ${anchorPos} (need ${needSig}), skipping to continue chain`);
          // Skip to next anchor - this is the "skip to the next always" behavior
        }
      }
      
      console.log(`↑ Column ${col} complete`);
    }
    
    this.onGridUpdate([...this.grid]);
    console.log(`↓ Vertical chains complete: ${totalMatches} vertical connections made`);
    return `Vertical chains complete! Built ${totalMatches} vertical connections using two-segment edge matching.`;
  }

  // DEBUG HELPER - Display edge signatures for verification
  public getDebugSignatures(): Array<{position: number, signatures: EdgeSignature}> {
    const debugInfo: Array<{position: number, signatures: EdgeSignature}> = [];
    
    for (let i = 0; i < this.grid.length; i++) {
      if (this.grid[i].tile) {
        debugInfo.push({
          position: i,
          signatures: this.getTileEdgeSignatures(i)
        });
      }
    }
    
    return debugInfo;
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
        
        const sigs = this.getTileEdgeSignatures(pos);
        rowSigs.push(`${pos}:T${sigs.top}|R${sigs.right}|B${sigs.bottom}|L${sigs.left}`);
      }
      
      console.log(`Row ${row}: ${rowSigs.join(' | ')}`);
    }
    
    return 'Edge signatures logged to console';
  }

  // 4. COMBO FUNCTION - The full beautiful pattern algorithm
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