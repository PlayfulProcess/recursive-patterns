'use client';

import React from 'react';

export interface TileData {
  id: string;
  edge1: string; // South edge
  edge2: string; // West edge
  edge3: string; // North edge
  edge4: string; // East edge
  shape: number; // Shape family (0,1,2,3)
  mirrorH: string; // Horizontal mirror ID
  mirrorV: string; // Vertical mirror ID
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
              <th className="border border-gray-600 px-2 py-1 text-left text-white">Edge-S</th>
              <th className="border border-gray-600 px-2 py-1 text-left text-white">Edge-W</th>
              <th className="border border-gray-600 px-2 py-1 text-left text-white">Edge-N</th>
              <th className="border border-gray-600 px-2 py-1 text-left text-white">Edge-E</th>
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
                <td className="border border-gray-600 px-2 py-1 text-center text-white">{tile.edge1}</td>
                <td className="border border-gray-600 px-2 py-1 text-center text-white">{tile.edge2}</td>
                <td className="border border-gray-600 px-2 py-1 text-center text-white">{tile.edge3}</td>
                <td className="border border-gray-600 px-2 py-1 text-center text-white">{tile.edge4}</td>
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