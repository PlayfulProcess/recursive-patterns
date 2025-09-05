'use client';

import React, { useState, useMemo } from 'react';

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

interface FilterState {
  pattern: string;
  matchingTiles: TileData[];
  highlightInGrid: boolean;
}

interface CSVTableProps {
  data: TileData[];
  onRowClick: (tile: TileData) => void;
  selectedTile?: TileData;
  onFilteredTilesChange?: (tiles: TileData[], highlight: boolean) => void;
}

/**
 * Filter tiles by edge pattern
 * @param tiles - Array of tile data
 * @param pattern - Pattern string like "a***", "*b*c", "abcd"
 * @returns Filtered tiles matching the pattern
 */
function filterByPattern(tiles: TileData[], pattern: string): TileData[] {
  if (!pattern || pattern.trim() === '') return tiles;
  
  const cleanPattern = pattern.toLowerCase().trim();
  if (cleanPattern.length !== 4) return tiles;
  
  return tiles.filter(tile => {
    const edges = [tile.edgeN, tile.edgeE, tile.edgeS, tile.edgeW];
    return cleanPattern.split('').every((char, i) => 
      char === '*' || edges[i].toLowerCase() === char
    );
  });
}

const CSVTable: React.FC<CSVTableProps> = ({ data, onRowClick, selectedTile, onFilteredTilesChange }) => {
  const [filterState, setFilterState] = useState<FilterState>({
    pattern: '',
    matchingTiles: data,
    highlightInGrid: false
  });

  // Memoized filtered data based on pattern
  const filteredData = useMemo(() => {
    return filterByPattern(data, filterState.pattern);
  }, [data, filterState.pattern]);

  // Update filtered tiles when filter changes
  React.useEffect(() => {
    const newFilterState = {
      ...filterState,
      matchingTiles: filteredData
    };
    setFilterState(newFilterState);
    
    // Notify parent component about filtered tiles
    if (onFilteredTilesChange) {
      onFilteredTilesChange(filteredData, filterState.highlightInGrid);
    }
  }, [filteredData, filterState.highlightInGrid, onFilteredTilesChange]);

  const handlePatternChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterState(prev => ({ ...prev, pattern: e.target.value }));
  };

  const toggleHighlight = () => {
    setFilterState(prev => {
      const newState = { ...prev, highlightInGrid: !prev.highlightInGrid };
      if (onFilteredTilesChange) {
        onFilteredTilesChange(prev.matchingTiles, newState.highlightInGrid);
      }
      return newState;
    });
  };

  const clearFilter = () => {
    setFilterState({
      pattern: '',
      matchingTiles: data,
      highlightInGrid: false
    });
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-4 text-white">Tile Patterns Data</h2>
      
      {/* Filter Controls */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-sm text-gray-300 mb-1">
              Filter by edge pattern (e.g., a***, *b*c, abcd):
            </label>
            <input
              type="text"
              value={filterState.pattern}
              onChange={handlePatternChange}
              placeholder="Enter 4-character pattern (use * for any edge)"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white 
                       placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={4}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleHighlight}
              className={`px-3 py-2 rounded font-semibold transition-colors ${
                filterState.highlightInGrid
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              {filterState.highlightInGrid ? '👁️ Highlighted' : '👁️ Highlight'}
            </button>
            <button
              onClick={clearFilter}
              className="px-3 py-2 bg-gray-600 text-gray-300 rounded hover:bg-gray-500 
                       transition-colors font-semibold"
            >
              Clear
            </button>
          </div>
        </div>
        
        {/* Filter Results Info */}
        <div className="text-sm text-gray-400">
          {filterState.pattern ? (
            <>
              Showing {filteredData.length} of {data.length} tiles matching "{filterState.pattern}"
              {filterState.highlightInGrid && filteredData.length > 0 && (
                <span className="text-blue-400 ml-2">• Highlighted in grid</span>
              )}
            </>
          ) : (
            `Showing all ${data.length} tiles`
          )}
        </div>
      </div>

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
            {filteredData.map((tile, index) => (
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