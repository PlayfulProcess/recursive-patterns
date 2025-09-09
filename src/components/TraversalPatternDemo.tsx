'use client';

import React, { useState, useEffect } from 'react';

interface TraversalPatternDemoProps {
  className?: string;
}

const PATTERN_COLORS = {
  current: '#FF6B6B',     // Red for current position
  visited: '#4ECDC4',     // Teal for visited positions
  next: '#FFA07A',        // Orange for next positions
  unvisited: '#374151'    // Gray for unvisited
};

type TraversalPattern = 'row-major' | 'column-major' | 'spiral-clockwise' | 'spiral-counter' | 'diagonal' | 'block-2x2' | 'checkerboard' | 'random-walk';

export default function TraversalPatternDemo({ className = '' }: TraversalPatternDemoProps) {
  const [selectedPattern, setSelectedPattern] = useState<TraversalPattern>('row-major');
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [traversalSequence, setTraversalSequence] = useState<number[]>([]);
  
  const gridWidth = 12;
  const gridHeight = 8;
  const totalCells = gridWidth * gridHeight;

  // Generate traversal sequence based on pattern
  const generateTraversalSequence = (pattern: TraversalPattern): number[] => {
    const sequence: number[] = [];
    
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
            for (let r = blockRow; r < Math.min(blockRow + 2, gridHeight); r++) {
              for (let c = blockCol; c < Math.min(blockCol + 2, gridWidth); c++) {
                sequence.push(r * gridWidth + c);
              }
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
  };

  // Update traversal sequence when pattern changes
  useEffect(() => {
    const sequence = generateTraversalSequence(selectedPattern);
    setTraversalSequence(sequence);
    setCurrentStep(0);
  }, [selectedPattern]);

  // Animation control
  const startAnimation = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setCurrentStep(0);
    
    const animate = () => {
      setCurrentStep(prev => {
        if (prev >= traversalSequence.length - 1) {
          setIsAnimating(false);
          return prev;
        }
        return prev + 1;
      });
    };
    
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= traversalSequence.length - 1) {
          clearInterval(interval);
          setIsAnimating(false);
          return prev;
        }
        return prev + 1;
      });
    }, 100); // Animation speed
  };

  const resetAnimation = () => {
    setCurrentStep(0);
    setIsAnimating(false);
  };

  const getCellState = (position: number) => {
    const stepIndex = traversalSequence.indexOf(position);
    
    if (stepIndex === currentStep && isAnimating) {
      return 'current';
    } else if (stepIndex < currentStep) {
      return 'visited';
    } else if (stepIndex === currentStep + 1 || stepIndex === currentStep + 2) {
      return 'next';
    } else {
      return 'unvisited';
    }
  };

  const getCellColor = (position: number) => {
    const state = getCellState(position);
    return PATTERN_COLORS[state];
  };

  const getCellNumber = (position: number) => {
    const stepIndex = traversalSequence.indexOf(position);
    return stepIndex < currentStep ? stepIndex + 1 : '';
  };

  return (
    <div className={`bg-gray-800 rounded-lg shadow-lg p-8 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-4">Traversal Pattern Visualization</h2>
        <p className="text-gray-300 text-sm mb-4">
          Watch how different algorithms traverse the grid step by step
        </p>
      </div>

      {/* Controls */}
      <div className="bg-gray-700 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={selectedPattern}
            onChange={(e) => setSelectedPattern(e.target.value as TraversalPattern)}
            disabled={isAnimating}
            className="px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
          >
            <option value="row-major">Row Major</option>
            <option value="column-major">Column Major</option>
            <option value="spiral-clockwise">Spiral Clockwise</option>
            <option value="spiral-counter">Spiral Counter-Clockwise</option>
            <option value="diagonal">Diagonal Sweeps</option>
            <option value="block-2x2">2x2 Blocks</option>
            <option value="checkerboard">Checkerboard</option>
            <option value="random-walk">Random Walk</option>
          </select>

          <button
            onClick={startAnimation}
            disabled={isAnimating}
            className={`px-4 py-2 text-white rounded-lg font-semibold transition-all duration-200
              ${isAnimating 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-green-700 hover:bg-green-600 hover:scale-[1.02] active:scale-[0.98]'}`}
          >
            {isAnimating ? '▶️ Animating...' : '▶️ Start Animation'}
          </button>

          <button
            onClick={resetAnimation}
            className="px-4 py-2 bg-red-700 text-white rounded-lg font-semibold
                     hover:bg-red-600 transition-all duration-200 
                     hover:scale-[1.02] active:scale-[0.98]"
          >
            🔄 Reset
          </button>

          <div className="text-sm text-gray-300">
            Step: {currentStep} / {traversalSequence.length}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: PATTERN_COLORS.current }}></div>
            <span className="text-gray-300">Current</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: PATTERN_COLORS.visited }}></div>
            <span className="text-gray-300">Visited</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: PATTERN_COLORS.next }}></div>
            <span className="text-gray-300">Next</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: PATTERN_COLORS.unvisited }}></div>
            <span className="text-gray-300">Unvisited</span>
          </div>
        </div>
      </div>

      {/* Grid Visualization */}
      <div className="bg-gray-900 p-4 rounded-lg">
        <div className="flex mb-4">
          {/* Row numbers */}
          <div className="flex flex-col">
            <div className="h-6 w-8"></div>
            {Array.from({length: gridHeight}, (_, i) => (
              <div key={`row-${i}`} className="aspect-square w-8 flex items-center justify-center text-sm text-gray-400 font-mono">
                {i + 1}
              </div>
            ))}
          </div>
          
          <div className="flex flex-col">
            {/* Column numbers */}
            <div className="flex h-6">
              {Array.from({length: gridWidth}, (_, i) => (
                <div key={`col-${i}`} className="aspect-square w-full flex items-center justify-center text-sm text-gray-400 font-mono">
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            
            {/* Main Grid */}
            <div 
              className="grid gap-0 border-2 border-gray-600"
              style={{ gridTemplateColumns: `repeat(${gridWidth}, 1fr)` }}
            >
              {Array.from({ length: totalCells }, (_, position) => (
                <div
                  key={position}
                  className="aspect-square border border-gray-700 flex items-center justify-center text-xs font-mono font-bold transition-all duration-200"
                  style={{ 
                    backgroundColor: getCellColor(position),
                    color: getCellState(position) === 'unvisited' ? '#9CA3AF' : '#000'
                  }}
                >
                  {getCellNumber(position)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pattern Description */}
      <div className="mt-4 p-4 bg-gray-700 rounded-lg">
        <h4 className="text-white font-semibold mb-2">
          {selectedPattern.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Pattern
        </h4>
        <p className="text-gray-300 text-sm">
          {selectedPattern === 'row-major' && 'Processes cells from left to right, then moves to the next row. This is the traditional scanning pattern used in reading.'}
          {selectedPattern === 'column-major' && 'Processes cells from top to bottom in each column before moving to the next column. Common in mathematical matrix operations.'}
          {selectedPattern === 'spiral-clockwise' && 'Starts from the outer edge and spirals inward clockwise. Creates a circular traversal pattern.'}
          {selectedPattern === 'spiral-counter' && 'Starts from the outer edge and spirals inward counter-clockwise. Reverse of clockwise spiral.'}
          {selectedPattern === 'diagonal' && 'Processes cells along diagonal lines from top-left to bottom-right. Creates a diamond-like traversal.'}
          {selectedPattern === 'block-2x2' && 'Divides the grid into 2×2 blocks and processes each block completely before moving to the next.'}
          {selectedPattern === 'checkerboard' && 'First processes all even-positioned cells, then all odd-positioned cells, like a checkerboard pattern.'}
          {selectedPattern === 'random-walk' && 'Visits cells in a random order. Useful for avoiding systematic biases in optimization.'}
        </p>
      </div>
    </div>
  );
}