'use client';

import React from 'react';
import TileRenderer from './TileRenderer';
import { TileData } from './CSVTable';
import { ColorScheme } from './ColorPalette';

interface TileFamilyProps {
  selectedTile: TileData;
  allTiles: TileData[];
  customColors?: ColorScheme;
}

const TileFamily: React.FC<TileFamilyProps> = ({ selectedTile, allTiles, customColors }) => {
  // Find all 4 rotations of the same shape
  const getRotationFamily = (tile: TileData): TileData[] => {
    return allTiles.filter(t => t.shape === tile.shape).sort((a, b) => {
      const rotationOrder = ['S', 'W', 'N', 'E'];
      return rotationOrder.indexOf(a.rotation) - rotationOrder.indexOf(b.rotation);
    });
  };

  // Find mirror tiles
  const getMirrorTile = (tileId: string): TileData | undefined => {
    return allTiles.find(t => t.id === tileId);
  };

  const rotationFamily = getRotationFamily(selectedTile);
  const mirrorH = getMirrorTile(selectedTile.mirrorH);
  const mirrorV = getMirrorTile(selectedTile.mirrorV);


  return (
    <div className="grid grid-cols-3 gap-8">
      {/* Selected Tile (Larger) */}
      <div className="flex flex-col items-center">
        <h3 className="text-white text-lg font-bold mb-4">Selected Tile</h3>
        <div className="border-2 border-blue-500 rounded-lg p-2">
          <TileRenderer
            tile={selectedTile}
            size={120}
            customColors={customColors}
          />
        </div>
      </div>

      {/* Rotation Family */}
      <div className="flex flex-col items-center">
        <h3 className="text-white text-lg font-bold mb-4">All Rotations</h3>
        <div className="grid grid-cols-2 gap-3">
          {rotationFamily.map((tile) => (
            <div
              key={tile.id}
              className={`${
                tile.id === selectedTile.id 
                  ? 'border-2 border-blue-400 rounded' 
                  : 'border border-gray-600 rounded'
              } p-1`}
            >
              <TileRenderer
                tile={tile}
                size={80}
                customColors={customColors}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Mirrors */}
      <div className="flex flex-col items-center">
        <h3 className="text-white text-lg font-bold mb-4">Mirrors</h3>
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-2">Mirror-H ({selectedTile.mirrorH})</p>
            {mirrorH ? (
              <div className="border border-gray-600 rounded p-1">
                <TileRenderer
                  tile={mirrorH}
                  size={80}
                  customColors={customColors}
                />
              </div>
            ) : (
              <div className="text-red-400 text-xs">Not found</div>
            )}
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-2">Mirror-V ({selectedTile.mirrorV})</p>
            {mirrorV ? (
              <div className="border border-gray-600 rounded p-1">
                <TileRenderer
                  tile={mirrorV}
                  size={80}
                  customColors={customColors}
                />
              </div>
            ) : (
              <div className="text-red-400 text-xs">Not found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TileFamily;