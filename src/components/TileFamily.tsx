'use client';

import React from 'react';
import TileRenderer from './TileRenderer';
import { TileData } from './CSVTable';
import { ColorScheme } from './ColorPalette';
import { getRotationFamily } from '@/lib/dataPrep';

interface TileFamilyProps {
  selectedTile: TileData;
  allTiles: TileData[];
  customColors?: ColorScheme;
}

const TileFamily: React.FC<TileFamilyProps> = ({ selectedTile, allTiles, customColors }) => {
  // Get actual rotation family from dataPrep
  const rotationFamily = getRotationFamily(selectedTile, allTiles);
  
  // Find mirror tiles by ID
  const getMirrorTile = (tileId: string): TileData | undefined => {
    return allTiles.find(t => t.id === tileId);
  };

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
        <h3 className="text-white text-lg font-bold mb-4">Rotations of Same Tile</h3>
        <div className="grid grid-cols-2 gap-3">
          {rotationFamily.map((tile, index) => {
            // Determine rotation degree based on which rotation it is
            const rotationDegrees = ['0°', '90°', '180°', '270°'];
            const isCurrentRotation = tile.id === selectedTile.id;
            
            return (
              <div key={tile.id} className="text-center">
                <div
                  className={`${
                    isCurrentRotation
                      ? 'border-2 border-blue-400 rounded' 
                      : 'border border-gray-600 rounded'
                  } p-1 mb-1`}
                >
                  <TileRenderer
                    tile={tile}
                    size={80}
                    customColors={customColors}
                  />
                </div>
                <p className={`text-xs ${isCurrentRotation ? 'text-blue-400 font-bold' : 'text-gray-400'}`}>
                  {tile.id}
                </p>
              </div>
            );
          })}
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">
          🔄 Same pattern, different orientations
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