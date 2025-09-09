'use client';

import React, { useState, useEffect } from 'react';

export interface PatternData {
  pattern2x2: string;
  patternRowMajor: string;
  patternColumnMajor: string;
  patternQuadrants: string;
}

export interface GridCell {
  row: number;
  col: number;
  tileId: string;
  patterns: PatternData;
}

interface PatternGridProps {
  gridWidth?: number;
  gridHeight?: number;
  className?: string;
}

const PATTERN_COLORS = {
  // Block colors (0-11 for 2x2 blocks)
  'block-0': '#FF6B6B', 'block-1': '#4ECDC4', 'block-2': '#45B7D1', 'block-3': '#FFA07A',
  'block-4': '#98D8C8', 'block-5': '#F7DC6F', 'block-6': '#BB8FCE', 'block-7': '#85C1E9',
  'block-8': '#F8C471', 'block-9': '#82E0AA', 'block-10': '#F1948A', 'block-11': '#AED6F1',
  
  // Quadrant colors
  'quadrant-NW': '#FF6B6B',
  'quadrant-NE': '#4ECDC4',
  'quadrant-SW': '#45B7D1',
  'quadrant-SE': '#FFA07A',
};

type PatternType = 'pattern2x2' | 'patternRowMajor' | 'patternColumnMajor' | 'patternQuadrants';

export default function PatternGrid({ gridWidth = 12, gridHeight = 8, className = '' }: PatternGridProps) {
  const [csvData, setCsvData] = useState<GridCell[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<PatternType>('pattern2x2');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCSVData();
  }, []);

  const loadCSVData = async () => {
    try {
      const response = await fetch('/hardcoded-grid-patterns.csv');
      const text = await response.text();
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());

      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });

        return {
          row: parseInt(row.row),
          col: parseInt(row.col),
          tileId: row.tileId,
          patterns: {
            pattern2x2: row.pattern2x2,
            patternRowMajor: row.patternRowMajor,
            patternColumnMajor: row.patternColumnMajor,
            patternQuadrants: row.patternQuadrants,
          }
        } as GridCell;
      });

      setCsvData(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load pattern data:', error);
      setIsLoading(false);
    }
  };

  const getCellColor = (cell: GridCell, patternType: PatternType): string => {
    const patternValue = cell.patterns[patternType];
    
    switch (patternType) {
      case 'pattern2x2':
        const blockNum = parseInt(patternValue.replace('Block', '')) || 1;
        const colorIndex = (blockNum - 1) % 12;
        return PATTERN_COLORS[`block-${colorIndex}` as keyof typeof PATTERN_COLORS];
        
      case 'patternQuadrants':
        return PATTERN_COLORS[`quadrant-${patternValue}` as keyof typeof PATTERN_COLORS];
        
      case 'patternRowMajor':
        const rowNum = parseInt(patternValue.replace('Row', '')) || 1;
        const rowColorIndex = (rowNum - 1) % 12;
        return PATTERN_COLORS[`block-${rowColorIndex}` as keyof typeof PATTERN_COLORS];
        
      case 'patternColumnMajor':
        const colNum = parseInt(patternValue.replace('Col', '')) || 1;
        const colColorIndex = (colNum - 1) % 12;
        return PATTERN_COLORS[`block-${colColorIndex}` as keyof typeof PATTERN_COLORS];
        
      default:
        return '#f3f4f6';
    }
  };

  const getPatternDescription = (patternType: PatternType): string => {
    const uniqueValues = [...new Set(csvData.map(cell => cell.patterns[patternType]))];
    return `${uniqueValues.length} sections: ${uniqueValues.join(', ')}`;
  };

  if (isLoading) {
    return (
      <div className={`bg-gray-800 rounded-lg p-8 ${className}`}>
        <div className="text-white">Loading pattern data...</div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg shadow-lg p-8 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Pattern Visualization ({gridWidth}×{gridHeight})</h2>
        
        <div className="flex gap-2">
          <select 
            value={selectedPattern} 
            onChange={(e) => setSelectedPattern(e.target.value as PatternType)}
            className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
          >
            <option value="pattern2x2">2x2 Blocks</option>
            <option value="patternRowMajor">Row Stripes</option>
            <option value="patternColumnMajor">Column Stripes</option>
            <option value="patternQuadrants">Four Quadrants</option>
          </select>
        </div>
      </div>

      {/* Pattern Description */}
      <div className="mb-4 text-sm text-gray-300">
        {getPatternDescription(selectedPattern)}
      </div>

      {/* Grid Display */}
      <div className="flex mb-6">
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
            {csvData.map((cell, index) => (
              <div
                key={`${cell.col}-${cell.row}`}
                className="aspect-square border border-gray-700 flex items-center justify-center text-xs font-mono transition-all duration-200 hover:scale-105 hover:z-10 relative"
                style={{ 
                  backgroundColor: getCellColor(cell, selectedPattern),
                  color: '#000'
                }}
                title={`${String.fromCharCode(64 + cell.col)}${cell.row}: ${cell.patterns[selectedPattern]}`}
              >
                {cell.tileId}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pattern Statistics */}
      <div className="text-sm text-gray-400 flex gap-6">
        <span>Total cells: {csvData.length}</span>
        <span>Pattern: {selectedPattern.replace('pattern', '').replace(/([A-Z])/g, ' $1')}</span>
      </div>
    </div>
  );
}