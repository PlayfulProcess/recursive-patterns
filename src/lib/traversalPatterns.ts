// Shared traversal pattern generation utility
export type TraversalPattern = 'row-major' | 'column-major' | 'spiral-clockwise' | 'spiral-counter' | 'diagonal' | 'block-2x2' | 'checkerboard' | 'random-walk';

export function generateTraversalSequence(
  pattern: TraversalPattern, 
  gridWidth: number, 
  gridHeight: number
): number[] {
  const sequence: number[] = [];
  const totalCells = gridWidth * gridHeight;
  
  switch (pattern) {
    case 'row-major':
      for (let row = 0; row < gridHeight; row++) {
        for (let col = 0; col < gridWidth; col++) {
          sequence.push(row * gridWidth + col);
        }
      }
      break;
      
    case 'column-major':
      for (let col = 0; col < gridWidth; col++) {
        for (let row = 0; row < gridHeight; row++) {
          sequence.push(row * gridWidth + col);
        }
      }
      break;
      
    case 'spiral-clockwise':
      let top = 0, bottom = gridHeight - 1, left = 0, right = gridWidth - 1;
      
      while (top <= bottom && left <= right) {
        // Top row (left to right)
        for (let col = left; col <= right; col++) {
          sequence.push(top * gridWidth + col);
        }
        top++;
        
        // Right column (top to bottom)
        for (let row = top; row <= bottom; row++) {
          sequence.push(row * gridWidth + right);
        }
        right--;
        
        // Bottom row (right to left)
        if (top <= bottom) {
          for (let col = right; col >= left; col--) {
            sequence.push(bottom * gridWidth + col);
          }
          bottom--;
        }
        
        // Left column (bottom to top)
        if (left <= right) {
          for (let row = bottom; row >= top; row--) {
            sequence.push(row * gridWidth + left);
          }
          left++;
        }
      }
      break;
      
    case 'spiral-counter':
      let t = 0, b = gridHeight - 1, l = 0, r = gridWidth - 1;
      
      while (t <= b && l <= r) {
        // Left column (top to bottom)
        for (let row = t; row <= b; row++) {
          sequence.push(row * gridWidth + l);
        }
        l++;
        
        // Bottom row (left to right)
        if (t <= b) {
          for (let col = l; col <= r; col++) {
            sequence.push(b * gridWidth + col);
          }
          b--;
        }
        
        // Right column (bottom to top)
        if (l <= r) {
          for (let row = b; row >= t; row--) {
            sequence.push(row * gridWidth + r);
          }
          r--;
        }
        
        // Top row (right to left)
        if (t <= b) {
          for (let col = r; col >= l; col--) {
            sequence.push(t * gridWidth + col);
          }
          t++;
        }
      }
      break;
      
    case 'diagonal':
      for (let d = 0; d < gridHeight + gridWidth - 1; d++) {
        for (let row = 0; row < gridHeight; row++) {
          const col = d - row;
          if (col >= 0 && col < gridWidth) {
            sequence.push(row * gridWidth + col);
          }
        }
      }
      break;
      
    case 'block-2x2':
      for (let blockRow = 0; blockRow < gridHeight; blockRow += 2) {
        for (let blockCol = 0; blockCol < gridWidth; blockCol += 2) {
          // New pattern: down→right→up→right (continuous process)
          // Top-left
          sequence.push(blockRow * gridWidth + blockCol);
          // Bottom-left (down)
          if (blockRow + 1 < gridHeight) {
            sequence.push((blockRow + 1) * gridWidth + blockCol);
          }
          // Bottom-right (right)
          if (blockRow + 1 < gridHeight && blockCol + 1 < gridWidth) {
            sequence.push((blockRow + 1) * gridWidth + (blockCol + 1));
          }
          // Top-right (up)
          if (blockCol + 1 < gridWidth) {
            sequence.push(blockRow * gridWidth + (blockCol + 1));
          }
        }
      }
      break;
      
    case 'checkerboard':
      // First pass: even positions
      for (let row = 0; row < gridHeight; row++) {
        for (let col = 0; col < gridWidth; col++) {
          if ((row + col) % 2 === 0) {
            sequence.push(row * gridWidth + col);
          }
        }
      }
      // Second pass: odd positions
      for (let row = 0; row < gridHeight; row++) {
        for (let col = 0; col < gridWidth; col++) {
          if ((row + col) % 2 === 1) {
            sequence.push(row * gridWidth + col);
          }
        }
      }
      break;
      
    case 'random-walk':
      const positions = Array.from({ length: totalCells }, (_, i) => i);
      for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
      }
      sequence.push(...positions);
      break;
      
    default:
      // Fallback to row-major
      for (let i = 0; i < totalCells; i++) {
        sequence.push(i);
      }
  }
  
  return sequence;
}