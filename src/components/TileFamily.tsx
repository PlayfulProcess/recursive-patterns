'use client';

import React from 'react';
import TileRenderer from './TileRenderer';
import { TileData } from './CSVTable';

interface TileFamilyProps {
  selectedTile: TileData;
  allTiles: TileData[];
}

const TileFamily: React.FC<TileFamilyProps> = ({ selectedTile, allTiles }) => {
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

  console.log('=== Debug Mirror Lookup ===');
  console.log('Selected tile:', selectedTile.id);
  console.log('Mirror-H ID:', `"${selectedTile.mirrorH}"`, 'Found:', !!mirrorH);
  console.log('Mirror-V ID:', `"${selectedTile.mirrorV}"`, 'Found:', !!mirrorV);
  console.log('Total tiles loaded:', allTiles.length);
  
  if (!mirrorV) {
    console.log('Searching for Mirror-V ID:', `"${selectedTile.mirrorV}"`);
    const exactMatch = allTiles.find(t => t.id === selectedTile.mirrorV);
    const similarMatches = allTiles.filter(t => t.id.includes('baac'));
    console.log('Exact match:', exactMatch);
    console.log('Similar matches:', similarMatches.map(t => `"${t.id}"`));
  }

  return (
    <div className="grid grid-cols-3 gap-8">
      {/* Selected Tile (Larger) */}
      <div className="flex flex-col items-center">
        <h3 className="text-white text-lg font-bold mb-4">Selected Tile</h3>
        <div className="border-2 border-blue-500 rounded-lg p-2">
          <TileRenderer
            id={selectedTile.id}
            edge1={selectedTile.edge1}
            edge2={selectedTile.edge2}
            edge3={selectedTile.edge3}
            edge4={selectedTile.edge4}
            rotation={selectedTile.rotation}
            shape={selectedTile.shape}
            size={120}
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
                id={tile.id}
                edge1={tile.edge1}
                edge2={tile.edge2}
                edge3={tile.edge3}
                edge4={tile.edge4}
                rotation={tile.rotation}
                shape={tile.shape}
                size={80}
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
                  id={mirrorH.id}
                  edge1={mirrorH.edge1}
                  edge2={mirrorH.edge2}
                  edge3={mirrorH.edge3}
                  edge4={mirrorH.edge4}
                  rotation={mirrorH.rotation}
                  shape={mirrorH.shape}
                  size={80}
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
                  id={mirrorV.id}
                  edge1={mirrorV.edge1}
                  edge2={mirrorV.edge2}
                  edge3={mirrorV.edge3}
                  edge4={mirrorV.edge4}
                  rotation={mirrorV.rotation}
                  shape={mirrorV.shape}
                  size={80}
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