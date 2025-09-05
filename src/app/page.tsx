'use client';

import React, { useState, useEffect } from 'react';
import TileFamily from '@/components/TileFamily';
import CSVTable, { TileData } from '@/components/CSVTable';
import ColorPalette, { ColorScheme } from '@/components/ColorPalette';
import MiniPlayground from '@/components/MiniPlayground';
import MainGridEnhanced from '@/components/MainGridEnhanced';
import AIPatternChatPopup from '@/components/AIPatternChatPopup';
import { TileProvider, useTiles } from '@/contexts/TileContext';

interface GridCell {
  x: number;
  y: number;
  tile?: TileData;
  // No rotation needed - tiles from CSV already have correct orientation
}

function HomeContent() {
  const { tiles, loading, error, uniqueTiles } = useTiles();
  const [selectedTile, setSelectedTile] = useState<TileData | undefined>();
  const [customColors, setCustomColors] = useState<ColorScheme>({
    a: '#E8B4B8', // Pink
    b: '#6B9BD1', // Blue
    c: '#C8B094', // Beige
    d: '#F5F1E8', // Cream
  });
  
  // Shared grid state for AI chat
  const [mainGrid, setMainGrid] = useState<GridCell[]>(() => {
    const cells: GridCell[] = [];
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 12; x++) {
        cells.push({ x, y });
      }
    }
    return cells;
  });

  useEffect(() => {
    if (tiles.length > 0 && !selectedTile) {
      setSelectedTile(tiles[0]);
    }
  }, [tiles, selectedTile]);

  const handleRowClick = (tile: TileData) => {
    setSelectedTile(tile);
    // The highlighting will be handled by MainGridEnhanced component via the selectedTileFromTable prop
  };

  const handleColorChange = (edge: 'a' | 'b' | 'c' | 'd', color: string) => {
    setCustomColors(prev => ({
      ...prev,
      [edge]: color
    }));
  };

  // Fill grid with ALL 96 tiles (1-to-1 mapping, no duplicates)
  useEffect(() => {
    if (tiles.length === 96 && mainGrid.every(cell => !cell.tile)) {
      console.log('🎯 Filling grid with all 96 tiles (1-to-1 mapping)...');
      
      const newGrid = [...mainGrid];
      
      // Shuffle all 96 tiles for random placement
      const shuffledTiles = [...tiles].sort(() => Math.random() - 0.5);
      
      // Fill grid with ALL tiles (exact 1-to-1 mapping)
      for (let i = 0; i < Math.min(shuffledTiles.length, newGrid.length); i++) {
        newGrid[i] = {
          ...newGrid[i],
          tile: shuffledTiles[i] // Each tile used exactly once
        };
      }
      
      setMainGrid(newGrid);
      console.log('✅ Grid filled with ALL tiles:', newGrid.filter(c => c.tile).length, '/ 96');
      console.log('🎯 No duplicates: Each tile used exactly once');
    }
  }, [tiles, mainGrid]);

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading tiles...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 bg-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-white">Recursive Pattern Tiles</h1>
        
        {/* Color Palette */}
        <ColorPalette 
          selectedColors={customColors} 
          onColorChange={handleColorChange} 
        />
        
        {/* Tile Family Viewer */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-white">Tile Family</h2>
          {selectedTile ? (
            <TileFamily 
              selectedTile={selectedTile} 
              allTiles={tiles} 
              customColors={customColors}
            />
          ) : (
            <div className="text-gray-400 text-center">Loading...</div>
          )}
        </div>

        {/* CSV Table */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <CSVTable 
            data={tiles} 
            onRowClick={handleRowClick}
            selectedTile={selectedTile}
          />
        </div>

        {/* Main Grid Enhanced */}
        <MainGridEnhanced 
          allTiles={tiles}
          customColors={customColors}
          grid={mainGrid}
          onGridUpdate={setMainGrid}
          selectedTileFromTable={selectedTile}
        />

        {/* AI Pattern Chat Popup */}
        <AIPatternChatPopup
          grid={mainGrid}
          allTiles={tiles}
          onGridUpdate={setMainGrid}
          gridWidth={12}
          gridHeight={8}
        />


        {/* Mini Playground */}
        <MiniPlayground 
          allTiles={tiles}
          customColors={customColors}
        />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <TileProvider>
      <HomeContent />
    </TileProvider>
  );
}
