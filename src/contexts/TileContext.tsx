'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TileData } from '@/components/CSVTable';
import { loadTiles, buildTileMaps, getUniqueTiles, getRotationFamily } from '@/lib/dataPrep';

interface TileContextType {
  tiles: TileData[];
  loading: boolean;
  error: string | null;
  tileMaps: {
    byId: Map<string, TileData>;
    byShape: Map<number, TileData[]>;
  };
  uniqueTiles: TileData[];
  reloadTiles: () => Promise<void>;
  findTileById: (id: string) => TileData | undefined;
  getTilesByShape: (shape: number) => TileData[];
  getRotationFamily: (tile: TileData) => TileData[];
}

const TileContext = createContext<TileContextType | undefined>(undefined);

export function TileProvider({ children }: { children: React.ReactNode }) {
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tileMaps, setTileMaps] = useState<{
    byId: Map<string, TileData>;
    byShape: Map<number, TileData[]>;
  }>({ byId: new Map(), byShape: new Map() });
  const [uniqueTiles, setUniqueTiles] = useState<TileData[]>([]);

  const reloadTiles = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Loading tiles from CSV...');
      const loadedTiles = await loadTiles('/patterns4.csv');
      
      if (loadedTiles.length === 0) {
        throw new Error('No tiles loaded from CSV');
      }

      console.log(`📊 Loaded ${loadedTiles.length} tiles`);
      setTiles(loadedTiles);
      
      const maps = buildTileMaps(loadedTiles);
      setTileMaps(maps);
      
      const unique = getUniqueTiles(loadedTiles);
      setUniqueTiles(unique);
      
      console.log(`✅ Tile context initialized: ${loadedTiles.length} tiles, ${unique.length} unique families`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load tiles';
      console.error('❌ Tile loading error:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadTiles();
  }, []);

  const findTileById = (id: string): TileData | undefined => {
    return tileMaps.byId.get(id);
  };

  const getTilesByShape = (shape: number): TileData[] => {
    return tileMaps.byShape.get(shape) || [];
  };

  const getTileRotationFamily = (tile: TileData): TileData[] => {
    return getRotationFamily(tile, tiles);
  };

  const contextValue: TileContextType = {
    tiles,
    loading,
    error,
    tileMaps,
    uniqueTiles,
    reloadTiles,
    findTileById,
    getTilesByShape,
    getRotationFamily: getTileRotationFamily
  };

  return (
    <TileContext.Provider value={contextValue}>
      {children}
    </TileContext.Provider>
  );
}

export function useTiles() {
  const context = useContext(TileContext);
  if (!context) {
    throw new Error('useTiles must be used within a TileProvider');
  }
  return context;
}