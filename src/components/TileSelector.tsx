'use client';

import React, { useState } from 'react';
import TileRenderer from '@/components/TileRenderer';
import { TileData } from '@/components/CSVTable';
import { ColorScheme } from '@/components/ColorPalette';

interface TileSelectorProps {
  allTiles: TileData[];
  customColors: ColorScheme;
  onTileSelect: (tile: TileData, rotation: number) => void;
  onClose: () => void;
}

export default function TileSelector({ allTiles, customColors, onTileSelect, onClose }: TileSelectorProps) {
  const [selectedTile, setSelectedTile] = useState<TileData | null>(null);
  const [rotation, setRotation] = useState(0);

  const handleTileClick = (tile: TileData) => {
    setSelectedTile(tile);
  };

  const handlePlace = () => {
    if (selectedTile) {
      onTileSelect(selectedTile, rotation);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Select Tile</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        <div className="flex gap-6 flex-1 overflow-hidden">
          {/* Tile Grid */}
          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-8 gap-2">
              {allTiles.map((tile) => (
                <div
                  key={tile.id}
                  onClick={() => handleTileClick(tile)}
                  className={`
                    aspect-square border-2 rounded cursor-pointer p-2 transition-all
                    ${selectedTile?.id === tile.id 
                      ? 'border-yellow-400 bg-gray-700' 
                      : 'border-gray-600 hover:border-gray-400 bg-gray-900'
                    }
                  `}
                >
                  <TileRenderer
                    tile={tile}
                    customColors={customColors}
                    size={40}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Preview Panel */}
          {selectedTile && (
            <div className="w-64 bg-gray-700 rounded-lg p-4">
              <h4 className="text-white font-bold mb-4">Preview</h4>
              
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24">
                  <TileRenderer
                    tile={selectedTile}
                    customColors={customColors}
                    size={96}
                  />
                </div>
              </div>

              <div className="text-white text-sm mb-4">
                <p><strong>ID:</strong> {selectedTile.id}</p>
                <p><strong>Edges:</strong> N:{selectedTile.edgeN} E:{selectedTile.edgeE} S:{selectedTile.edgeS} W:{selectedTile.edgeW}</p>
                <p><strong>Rotation:</strong> {rotation}°</p>
              </div>

              <div className="mb-4">
                <label className="block text-white text-sm mb-2">Rotation:</label>
                <div className="flex gap-2">
                  {[0, 90, 180, 270].map((rot) => (
                    <button
                      key={rot}
                      onClick={() => setRotation(rot)}
                      className={`
                        px-3 py-1 rounded text-sm transition-colors
                        ${rotation === rot 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        }
                      `}
                    >
                      {rot}°
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={handlePlace}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Place Tile
                </button>
                <button 
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}