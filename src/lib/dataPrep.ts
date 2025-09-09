/**
 * DATA PREPARATION MODULE - Single Source of Truth
 * Implements Copilot's suggested approach for clean tile data management
 */

import type { TileData } from '@/components/CSVTable';

// Flexible column detection for CSV parsing
function getIdx(headers: string[]) {
  const H = headers.map(h => h.trim().toLowerCase());
  const find = (...names: string[]) => names.map(n => H.indexOf(n.toLowerCase())).find(i => i >= 0) ?? -1;
  return {
    id: find('id', 'tile_id'),
    N: find('edgen', 'n', 'north'),
    E: find('edgee', 'e', 'east'), 
    S: find('edges', 's', 'south'),
    W: find('edgew', 'w', 'west'),
    shape: find('shape', 'family'),
    mirrorH: find('mirrorh', 'h_mirror_id', 'horizontal_mirror_id'),
    mirrorV: find('mirrorv', 'v_mirror_id', 'vertical_mirror_id'),
    rot0: find('rotation0', 'rot0', 'r0', 'code0'),
    rot90: find('rotation90', 'rot90', 'r90', 'code90'),
    rot180: find('rotation180', 'rot180', 'r180', 'code180'),
    rot270: find('rotation270', 'rot270', 'r270', 'code270'),
    rotation: find('rotation', 'rot', 'rotation_value'), // Add rotation column
    code: find('code', 'edges', 'pattern') // optional 4-letter code fallback
  };
}

const pick = (arr: string[], i: number) => (i >= 0 && i < arr.length ? arr[i]?.trim() : '');

// Parse CSV text into normalized TileData array
export function parsePatternsCsv(text: string): TileData[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(s => s.trim());
  const idx = getIdx(headers);
  
  return lines.slice(1).map(line => {
    const cols = line.split(',').map(s => s.trim());
    const tile: TileData = {
      id: pick(cols, idx.id),
      edgeN: pick(cols, idx.N),
      edgeE: pick(cols, idx.E),
      edgeS: pick(cols, idx.S),
      edgeW: pick(cols, idx.W),
      shape: Number(pick(cols, idx.shape)) || 0,
      mirrorH: pick(cols, idx.mirrorH),
      mirrorV: pick(cols, idx.mirrorV),
      rotation0: pick(cols, idx.rot0) || pick(cols, idx.code),
      rotation90: pick(cols, idx.rot90),
      rotation180: pick(cols, idx.rot180),
      rotation270: pick(cols, idx.rot270),
      rotation: Number(pick(cols, idx.rotation)) || 0,
    };
    return tile;
  });
}

// Convert 4-letter rotation code to NESW edges  
// Mapping: code[0]=S (bottom), code[1]=W (left), code[2]=N (top), code[3]=E (right)
export function neswFromCode(code?: string): {N:string; E:string; S:string; W:string} | null {
  if (!code || code.length !== 4) return null;
  return { 
    N: code[2], // North = code[2] 
    E: code[3], // East = code[3]
    S: code[0], // South = code[0]
    W: code[1]  // West = code[1]
  };
}

// Get NESW edges from tile - prefer explicit columns, fallback to rotation0 code
export function getNESW(tile: TileData): {N:string; E:string; S:string; W:string} {
  if (tile.edgeN && tile.edgeE && tile.edgeS && tile.edgeW) {
    return { N: tile.edgeN, E: tile.edgeE, S: tile.edgeS, W: tile.edgeW };
  }
  const from0 = neswFromCode(tile.rotation0);
  return from0 ?? { N: 'x', E: 'x', S: 'x', W: 'x' };
}

// Get edges for specific rotation using CSV rotation codes (no math!)
export function edgesForRotation(tile: TileData, deg: 0|90|180|270): {N:string; E:string; S:string; W:string} {
  const code =
    deg === 0 ? tile.rotation0 :
    deg === 90 ? tile.rotation90 :
    deg === 180 ? tile.rotation180 :
    tile.rotation270;
    
  const nesw = neswFromCode(code || '');
  if (nesw) return nesw;
  
  // fallback to base NESW if specific code missing
  return getNESW(tile);
}

// Client-side CSV loader with error handling
export async function loadTiles(csvPath = '/patterns4.csv'): Promise<TileData[]> {
  try {
    const res = await fetch(csvPath);
    if (!res.ok) throw new Error(`Failed to fetch ${csvPath}: ${res.status}`);
    const text = await res.text();
    return parsePatternsCsv(text);
  } catch (error) {
    console.error('Failed to load tiles:', error);
    return [];
  }
}

// Build tile lookup maps for efficient access
export function buildTileMaps(tiles: TileData[]) {
  const byId = new Map(tiles.map(t => [t.id, t]));
  const byShape = new Map<number, TileData[]>();
  
  tiles.forEach(tile => {
    const shape = tile.shape;
    if (!byShape.has(shape)) {
      byShape.set(shape, []);
    }
    byShape.get(shape)!.push(tile);
  });
  
  return { byId, byShape };
}

// Get all unique base tiles (one per rotation family)
export function getUniqueTiles(tiles: TileData[]): TileData[] {
  const seen = new Set<string>();
  const unique: TileData[] = [];
  
  for (const tile of tiles) {
    // Check if we've seen any rotation of this tile
    const rotations = [tile.rotation0, tile.rotation90, tile.rotation180, tile.rotation270];
    const isNewFamily = rotations.every(rot => !seen.has(rot || ''));
    
    if (isNewFamily) {
      // Mark all rotations as seen
      rotations.forEach(rot => rot && seen.add(rot));
      unique.push(tile);
    }
  }
  
  console.log(`📊 Found ${unique.length} unique tile families from ${tiles.length} total tiles`);
  return unique;
}

// Get rotation family for a specific tile
export function getRotationFamily(tile: TileData, allTiles: TileData[]): TileData[] {
  const { byId } = buildTileMaps(allTiles);
  const family: TileData[] = [];
  
  // Find all rotation variants
  const rotationIds = [tile.rotation0, tile.rotation90, tile.rotation180, tile.rotation270];
  
  rotationIds.forEach((rotId, index) => {
    if (rotId) {
      const rotTile = byId.get(rotId);
      if (rotTile) {
        family.push(rotTile);
      }
    }
  });
  
  return family;
}