'use client';

import React from 'react';

export interface TileData {
  id: string;
  edgeN: string; // North edge (Top)
  edgeE: string; // East edge (Right)
  edgeS: string; // South edge (Bottom)
  edgeW: string; // West edge (Left)
  shape: number; // Shape family (0,1,2,3)
  mirrorH: string; // Horizontal mirror ID
  mirrorV: string; // Vertical mirror ID
  rotation0: string; // 0° rotation ID
  rotation90: string; // 90° rotation ID
  rotation180: string; // 180° rotation ID
  rotation270: string; // 270° rotation ID
}

interface CSVTableProps {
  data: TileData[];
  onRowClick: (tile: TileData) => void;
  selectedTile?: TileData;
}

const CSVTable: React.FC<CSVTableProps> = ({ data, onRowClick, selectedTile }) => {
  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-4 text-white">Tile Patterns Data</h2>
      <div className="overflow-auto max-h-96 border border-gray-600 rounded">
        <table className="w-full border-collapse">
          <thead className="bg-gray-700 sticky top-0">
            <tr>
              <th className="border border-gray-600 px-2 py-1 text-left text-white">ID</th>
              <th className="border border-gray-600 px-2 py-1 text-left text-white">0°</th>
              <th className="border border-gray-600 px-2 py-1 text-left text-white">90°</th>
              <th className="border border-gray-600 px-2 py-1 text-left text-white">180°</th>
              <th className="border border-gray-600 px-2 py-1 text-left text-white">270°</th>
              <th className="border border-gray-600 px-2 py-1 text-left text-white">Shape</th>
              <th className="border border-gray-600 px-2 py-1 text-left text-white">Mirror-H</th>
              <th className="border border-gray-600 px-2 py-1 text-left text-white">Mirror-V</th>
            </tr>
          </thead>
          <tbody>
            {data.map((tile, index) => (
              <tr
                key={tile.id}
                onClick={() => onRowClick(tile)}
                className={`cursor-pointer hover:bg-gray-600 ${
                  selectedTile?.id === tile.id ? 'bg-gray-600' : ''
                } ${index % 2 === 0 ? 'bg-gray-700' : 'bg-gray-800'}`}
              >
                <td className="border border-gray-600 px-2 py-1 font-mono text-sm text-white">{tile.id}</td>
                <td className="border border-gray-600 px-2 py-1 text-center text-white font-mono text-xs">{tile.rotation0}</td>
                <td className="border border-gray-600 px-2 py-1 text-center text-white font-mono text-xs">{tile.rotation90}</td>
                <td className="border border-gray-600 px-2 py-1 text-center text-white font-mono text-xs">{tile.rotation180}</td>
                <td className="border border-gray-600 px-2 py-1 text-center text-white font-mono text-xs">{tile.rotation270}</td>
                <td className="border border-gray-600 px-2 py-1 text-center text-white">{tile.shape}</td>
                <td className="border border-gray-600 px-2 py-1 text-center text-white font-mono text-xs">{tile.mirrorH}</td>
                <td className="border border-gray-600 px-2 py-1 text-center text-white font-mono text-xs">{tile.mirrorV}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CSVTable;