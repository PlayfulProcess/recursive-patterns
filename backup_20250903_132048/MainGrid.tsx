'use client';

import React, { useState } from 'react';
import TileRenderer from '@/components/TileRenderer';
import TileSelector from '@/components/TileSelector';
import { TileData } from '@/components/CSVTable';
import { ColorScheme } from '@/components/ColorPalette';

interface MainGridProps {
  allTiles: TileData[];
  customColors: ColorScheme;
}

interface GridCell {
  x: number;
  y: number;
  tile?: TileData;
  rotation?: number;
}

export default function MainGrid({ allTiles, customColors }: MainGridProps) {
  const [grid, setGrid] = useState<GridCell[]>(() => {
    const cells: GridCell[] = [];
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 12; x++) {
        cells.push({ x, y });
      }
    }
    return cells;
  });

  const [selectedCell, setSelectedCell] = useState<GridCell | null>(null);
  const [showTileSelector, setShowTileSelector] = useState(false);

  const handleCellClick = (cell: GridCell) => {
    setSelectedCell(cell);
    if (!cell.tile) {
      setShowTileSelector(true);
    }
  };

  const handleTileSelect = (tile: TileData, rotation: number) => {
    if (selectedCell) {
      placeTileInGrid(selectedCell, tile, rotation);
    }
    setShowTileSelector(false);
  };

  const placeTileInGrid = (cell: GridCell, tile: TileData, rotation = 0) => {
    setGrid(prev => prev.map(c => 
      c.x === cell.x && c.y === cell.y 
        ? { ...c, tile, rotation }
        : c
    ));
  };

  const clearCell = (cell: GridCell) => {
    setGrid(prev => prev.map(c => 
      c.x === cell.x && c.y === cell.y 
        ? { ...c, tile: undefined, rotation: undefined }
        : c
    ));
  };

  const fillGridWithAllTiles = () => {
    setGrid(prev => prev.map((cell, index) => {
      const tile = allTiles[index];
      return tile ? { ...cell, tile, rotation: 0 } : cell;
    }));
  };

  const clearGrid = () => {
    setGrid(prev => prev.map(cell => ({ ...cell, tile: undefined, rotation: undefined })));
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Main Grid (12×8 - 96 tiles)</h2>
        <div className="flex gap-4">
          <button 
            onClick={fillGridWithAllTiles}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Fill All Tiles
          </button>
          <button 
            onClick={clearGrid}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Clear Grid
          </button>
        </div>
      </div>

      {/* Grid Display - Seamless tiles like artwork with row/column numbers */}
      <div className="flex mb-6">
        {/* Column numbers */}
        <div className="flex flex-col">
          <div className="h-6 w-8"></div> {/* Empty corner */}
          {Array.from({length: 8}, (_, i) => (
            <div key={`row-${i}`} className="aspect-square w-8 flex items-center justify-center text-sm text-gray-400 font-mono">
              {i + 1}
            </div>
          ))}
        </div>
        
        <div className="flex flex-col">
          {/* Row numbers */}
          <div className="flex h-6">
            {Array.from({length: 12}, (_, i) => (
              <div key={`col-${i}`} className="aspect-square w-full flex items-center justify-center text-sm text-gray-400 font-mono">
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          
          {/* Main Grid */}
          <div className="grid grid-cols-12 gap-0 border-2 border-gray-600">
            {grid.map((cell, index) => (
              <div
                key={`${cell.x}-${cell.y}`}
                onClick={() => handleCellClick(cell)}
                className={`
                  aspect-square cursor-pointer transition-all duration-200 relative
                  ${selectedCell?.x === cell.x && selectedCell?.y === cell.y 
                    ? 'ring-2 ring-yellow-400 ring-inset z-10' 
                    : 'hover:ring-1 hover:ring-gray-400 hover:ring-inset hover:z-10'
                  }
                  ${cell.tile ? '' : 'bg-gray-900 border border-gray-700'}
                `}
              >
                {cell.tile && (
                  <TileRenderer
                    tile={cell.tile}
                    customColors={customColors}
                    rotation={cell.rotation || 0}
                    seamless={true}
                  />
                )}
                {!cell.tile && (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                    {String.fromCharCode(65 + cell.x)}{cell.y + 1}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Cell Info */}
      {selectedCell && (
        <div className="bg-gray-700 rounded-lg p-4 mb-4">
          <h3 className="text-white font-bold mb-2">
            Selected Cell: {String.fromCharCode(65 + selectedCell.x)}{selectedCell.y + 1}
          </h3>
          {selectedCell.tile ? (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16">
                <TileRenderer
                  tile={selectedCell.tile}
                  customColors={customColors}
                  rotation={selectedCell.rotation || 0}
                  size={64}
                />
              </div>
              <div className="text-white">
                <p>Tile ID: {selectedCell.tile.id}</p>
                <p>Rotation: {selectedCell.rotation || 0}°</p>
                <button 
                  onClick={() => clearCell(selectedCell)}
                  className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Remove Tile
                </button>
              </div>
            </div>
          ) : (
            <div className="text-gray-300">
              <p>Empty cell - click to place a tile</p>
              <div className="mt-2 text-sm">
                <p>Available tiles: {allTiles.length}</p>
                <p>Used tiles: {grid.filter(c => c.tile).length}</p>
              </div>
              <button 
                onClick={() => setShowTileSelector(true)}
                className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Choose Tile
              </button>
            </div>
          )}
        </div>
      )}

      {/* Grid Stats */}
      <div className="text-sm text-gray-400 flex gap-6">
        <span>Total cells: {grid.length}</span>
        <span>Filled: {grid.filter(c => c.tile).length}</span>
        <span>Empty: {grid.filter(c => !c.tile).length}</span>
      </div>

      {/* Tile Selector Modal */}
      {showTileSelector && (
        <TileSelector
          allTiles={allTiles}
          customColors={customColors}
          onTileSelect={handleTileSelect}
          onClose={() => setShowTileSelector(false)}
        />
      )}
    </div>
  );
}