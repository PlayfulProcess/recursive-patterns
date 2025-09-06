'use client';

import React, { useState } from 'react';
import TileRenderer from './TileRenderer';
import { TileData } from './CSVTable';
import { ColorScheme } from './ColorPalette';

interface GridCell {
  x: number;
  y: number;
  tile?: TileData;
  rotation?: number;
}

interface MiniPlaygroundProps {
  customColors: ColorScheme;
  miniGrid?: GridCell[];
  onMiniGridUpdate?: (newGrid: GridCell[]) => void;
}

const MiniPlayground: React.FC<MiniPlaygroundProps> = ({ 
  customColors, 
  miniGrid = [], 
  onMiniGridUpdate 
}) => {
  // Initialize empty grid if no grid provided
  const [internalGrid, setInternalGrid] = useState<GridCell[]>(() => {
    const cells: GridCell[] = [];
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 12; x++) {
        cells.push({ x, y });
      }
    }
    return cells;
  });

  const grid = miniGrid.length > 0 ? miniGrid : internalGrid;
  const setGrid = (newGrid: GridCell[]) => {
    if (onMiniGridUpdate) {
      onMiniGridUpdate(newGrid);
    } else {
      setInternalGrid(newGrid);
    }
  };

  const clearPlayground = () => {
    const emptyGrid: GridCell[] = [];
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 12; x++) {
        emptyGrid.push({ x, y });
      }
    }
    setGrid(emptyGrid);
  };

  const getCellKey = (cell: GridCell) => `${cell.x}-${cell.y}`;

  const handleCellClick = (cell: GridCell) => {
    // Remove tile from clicked cell
    const newGrid = grid.map(c => 
      c.x === cell.x && c.y === cell.y 
        ? { ...c, tile: undefined, rotation: undefined }
        : c
    );
    setGrid(newGrid);
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white text-xl font-bold">Mini Pattern Playground</h3>
        <button
          onClick={clearPlayground}
          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
        >
          Clear All
        </button>
      </div>
      
      {/* Instructions */}
      <div className="mb-4 p-3 bg-gray-700 rounded text-gray-300 text-sm">
        <p>Right-click tiles in the main grid to render them here in the same position</p>
        <p>Click tiles here to remove them</p>
      </div>

      {/* Mini Grid Display - Same layout as main grid */}
      <div className="flex mb-6">
        {/* Row numbers */}
        <div className="flex flex-col">
          <div className="h-4 w-6"></div> {/* Empty corner */}
          {Array.from({length: 8}, (_, i) => (
            <div key={`row-${i}`} className="aspect-square w-6 flex items-center justify-center text-xs text-gray-400 font-mono">
              {i + 1}
            </div>
          ))}
        </div>
        
        <div className="flex flex-col">
          {/* Column letters */}
          <div className="flex h-4">
            {Array.from({length: 12}, (_, i) => (
              <div key={`col-${i}`} className="aspect-square w-full flex items-center justify-center text-xs text-gray-400 font-mono">
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          
          {/* Mini Grid - Smaller tiles but same layout */}
          <div className="grid grid-cols-12 gap-0 border border-gray-600">
            {grid.map((cell) => {
              const cellKey = getCellKey(cell);
              
              return (
                <div
                  key={cellKey}
                  onClick={() => handleCellClick(cell)}
                  className="aspect-square cursor-pointer transition-all duration-200 relative hover:ring-1 hover:ring-gray-400 hover:ring-inset"
                  style={{ minWidth: '32px', minHeight: '32px' }}
                >
                  {cell.tile ? (
                    <TileRenderer
                      tile={cell.tile}
                      customColors={customColors}
                      size={32}
                      seamless={true}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-900 border border-gray-700 flex items-center justify-center">
                      <span className="text-gray-600 text-xs">
                        {String.fromCharCode(65 + cell.x)}{cell.y + 1}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="text-sm text-gray-400 flex gap-6 items-center">
        <span>Total cells: {grid.length}</span>
        <span>Filled: {grid.filter(c => c.tile).length}</span>
        <span>Empty: {grid.filter(c => !c.tile).length}</span>
      </div>
    </div>
  );
};

export default MiniPlayground;