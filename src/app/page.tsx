'use client';

import React, { useState, useEffect } from 'react';
import TileFamily from '@/components/TileFamily';
import CSVTable, { TileData } from '@/components/CSVTable';
import ColorPalette, { ColorScheme } from '@/components/ColorPalette';
import MiniPlayground from '@/components/MiniPlayground';
import MainGridEnhanced from '@/components/MainGridEnhanced';
import AIPatternChatPopup from '@/components/AIPatternChatPopup';

interface GridCell {
  x: number;
  y: number;
  tile?: TileData;
  rotation?: number;
}

export default function Home() {
  const [tiles, setTiles] = useState<TileData[]>([]);
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
    const loadTiles = async () => {
      try {
        // Try direct CSV file first, then API fallback
        let response = await fetch('/patterns2.csv');
        if (!response.ok) {
          response = await fetch('/api/patterns');
        }
        const csvText = await response.text();
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',');
        
        const tilesData: TileData[] = lines.slice(1).map(line => {
          const values = line.split(',');
          return {
            id: values[0]?.trim(),
            edge1: values[1]?.trim(), // edge-S (South/Top)
            edge2: values[2]?.trim(), // edge-W (West/Left) 
            edge3: values[3]?.trim(), // edge-N (North/Bottom)
            edge4: values[4]?.trim(), // edge-E (East/Right)
            rotation: values[5]?.trim(),
            shape: values[6]?.trim(),
            mirrorH: values[7]?.trim(),
            mirrorV: values[8]?.trim()
          };
        });
        
        setTiles(tilesData);
        setSelectedTile(tilesData[0]);
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    };

    loadTiles();
  }, []);

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

  // Fill grid with diverse tiles for AI testing
  useEffect(() => {
    if (tiles.length > 0 && mainGrid.every(cell => !cell.tile)) {
      console.log('🎯 Filling grid with diverse tiles for AI testing...');
      console.log('📊 Available tiles:', tiles.length);
      
      const newGrid = [...mainGrid];
      
      // Use exactly the number of available tiles (no duplicates)
      const maxTiles = Math.min(tiles.length, newGrid.length);
      
      // Shuffle tiles for better diversity
      const shuffledTiles = [...tiles].sort(() => Math.random() - 0.5);
      
      // Fill grid with unique tiles (1-to-1 mapping)
      for (let i = 0; i < maxTiles; i++) {
        newGrid[i] = {
          ...newGrid[i],
          tile: shuffledTiles[i], // Use exact tile, not modulo
          rotation: Math.floor(Math.random() * 4) * 90
        };
      }
      
      setMainGrid(newGrid);
      console.log('✅ Grid filled with', newGrid.filter(c => c.tile).length, 'tiles');
      console.log('🎲 Used', new Set(newGrid.filter(c => c.tile).map(c => c.tile?.id)).size, 'unique tile IDs');
      console.log('🧩 First few tile IDs:', newGrid.filter(c => c.tile).slice(0, 5).map(c => c.tile?.id));
    }
  }, [tiles, mainGrid]);

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
