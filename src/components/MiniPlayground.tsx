'use client';

import React, { useState, useRef } from 'react';
import TileRenderer from './TileRenderer';
import { TileData } from './CSVTable';
import { ColorScheme } from './ColorPalette';

interface PlaygroundTile extends TileData {
  x: number;
  y: number;
}

interface MiniPlaygroundProps {
  allTiles: TileData[];
  customColors: ColorScheme;
}

const MiniPlayground: React.FC<MiniPlaygroundProps> = ({ allTiles, customColors }) => {
  const [playgroundTiles, setPlaygroundTiles] = useState<PlaygroundTile[]>([]);
  const [draggedTile, setDraggedTile] = useState<TileData | null>(null);
  const playgroundRef = useRef<HTMLDivElement>(null);

  const GRID_SIZE = 60; // Size of each grid cell
  const PLAYGROUND_ROWS = 8;
  const PLAYGROUND_COLS = 12;

  const handleTileSelect = (tile: TileData) => {
    setDraggedTile(tile);
  };

  const handlePlaygroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggedTile || !playgroundRef.current) return;

    const rect = playgroundRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / GRID_SIZE);
    const y = Math.floor((e.clientY - rect.top) / GRID_SIZE);

    if (x >= 0 && x < PLAYGROUND_COLS && y >= 0 && y < PLAYGROUND_ROWS) {
      // Remove any existing tile at this position
      const newTiles = playgroundTiles.filter(t => !(t.x === x && t.y === y));
      
      // Add the new tile
      newTiles.push({
        ...draggedTile,
        x,
        y
      });

      setPlaygroundTiles(newTiles);
    }
  };

  const clearPlayground = () => {
    setPlaygroundTiles([]);
  };

  const removeTile = (x: number, y: number) => {
    setPlaygroundTiles(prev => prev.filter(t => !(t.x === x && t.y === y)));
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-white text-xl font-bold mb-4">Mini Pattern Playground</h3>
      
      {/* Instructions */}
      <div className="mb-4 p-3 bg-gray-700 rounded text-gray-300 text-sm">
        <p>1. Click a tile from the palette below to select it</p>
        <p>2. Click on the grid to place the selected tile</p>
        <p>3. Click an existing tile to remove it</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Playground Grid */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-white font-medium">Pattern Grid</h4>
            <div className="space-x-2">
              <span className="text-gray-400 text-sm">
                Selected: {draggedTile?.id || 'None'}
              </span>
              <button
                onClick={clearPlayground}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
              >
                Clear
              </button>
            </div>
          </div>
          
          <div
            ref={playgroundRef}
            onClick={handlePlaygroundClick}
            className="relative border-2 border-gray-600 rounded cursor-crosshair bg-gray-900"
            style={{
              width: PLAYGROUND_COLS * GRID_SIZE,
              height: PLAYGROUND_ROWS * GRID_SIZE,
            }}
          >
            {/* Grid lines */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width={PLAYGROUND_COLS * GRID_SIZE}
              height={PLAYGROUND_ROWS * GRID_SIZE}
            >
              {/* Vertical lines */}
              {Array.from({ length: PLAYGROUND_COLS + 1 }, (_, i) => (
                <line
                  key={`v-${i}`}
                  x1={i * GRID_SIZE}
                  y1={0}
                  x2={i * GRID_SIZE}
                  y2={PLAYGROUND_ROWS * GRID_SIZE}
                  stroke="#4B5563"
                  strokeWidth={0.5}
                />
              ))}
              {/* Horizontal lines */}
              {Array.from({ length: PLAYGROUND_ROWS + 1 }, (_, i) => (
                <line
                  key={`h-${i}`}
                  x1={0}
                  y1={i * GRID_SIZE}
                  x2={PLAYGROUND_COLS * GRID_SIZE}
                  y2={i * GRID_SIZE}
                  stroke="#4B5563"
                  strokeWidth={0.5}
                />
              ))}
            </svg>

            {/* Placed tiles */}
            {playgroundTiles.map((tile, index) => (
              <div
                key={index}
                className="absolute cursor-pointer hover:opacity-75"
                style={{
                  left: tile.x * GRID_SIZE + 2,
                  top: tile.y * GRID_SIZE + 2,
                  width: GRID_SIZE - 4,
                  height: GRID_SIZE - 4,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  removeTile(tile.x, tile.y);
                }}
                title={`${tile.id} - Click to remove`}
              >
                <TileRenderer
                  id={tile.id}
                  edge1={tile.edge1}
                  edge2={tile.edge2}
                  edge3={tile.edge3}
                  edge4={tile.edge4}
                  rotation={tile.rotation}
                  shape={tile.shape}
                  size={GRID_SIZE - 4}
                  customColors={customColors}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Tile Palette - First 24 tiles for quick access */}
        <div className="space-y-4">
          <h4 className="text-white font-medium">Quick Tile Palette</h4>
          <div className="grid grid-cols-6 gap-2 max-h-96 overflow-y-auto p-2 bg-gray-700 rounded">
            {allTiles.slice(0, 24).map((tile) => (
              <button
                key={tile.id}
                onClick={() => handleTileSelect(tile)}
                className={`p-1 rounded transition-all hover:scale-105 ${
                  draggedTile?.id === tile.id
                    ? 'bg-blue-600 ring-2 ring-blue-400'
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
                title={tile.id}
              >
                <TileRenderer
                  id={tile.id}
                  edge1={tile.edge1}
                  edge2={tile.edge2}
                  edge3={tile.edge3}
                  edge4={tile.edge4}
                  rotation={tile.rotation}
                  shape={tile.shape}
                  size={40}
                  customColors={customColors}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniPlayground;