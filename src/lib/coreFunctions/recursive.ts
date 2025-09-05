/**
 * Recursive algorithms and pattern analysis
 */

import { TileData } from '../../components/CSVTable';
import { GridCell, TileRelationships } from './types';

// Build comprehensive tile relationships from CSV data
export function buildTileRelationships(allTiles: TileData[]): TileRelationships {
  const mirrorMap = new Map<string, { horizontal: string; vertical: string }>();
  const shapeGroups = new Map<string, TileData[]>();
  const edgeIndex = new Map<string, TileData[]>();
  const tileById = new Map<string, TileData>();

  // Process each tile to build relationship maps
  allTiles.forEach(tile => {
    // Build mirror relationships map
    mirrorMap.set(tile.id, {
      horizontal: tile.mirrorH || '',
      vertical: tile.mirrorV || ''
    });

    // Build tile lookup by ID
    tileById.set(tile.id, tile);

    // Group tiles by shape family (same base pattern)
    const shapeKey = tile.shape.toString();
    if (!shapeGroups.has(shapeKey)) {
      shapeGroups.set(shapeKey, []);
    }
    shapeGroups.get(shapeKey)?.push(tile);

    // Index tiles by edge patterns for matching
    const edges = [tile.edgeN, tile.edgeE, tile.edgeS, tile.edgeW];
    edges.forEach((edge, i) => {
      const edgeKey = `${i}-${edge}`; // position-color
      if (!edgeIndex.has(edgeKey)) {
        edgeIndex.set(edgeKey, []);
      }
      edgeIndex.get(edgeKey)?.push(tile);
    });
  });

  console.log('🔗 Built tile relationships:', {
    mirrors: mirrorMap.size,
    shapes: shapeGroups.size,
    edgePatterns: edgeIndex.size
  });

  return { mirrorMap, shapeGroups, edgeIndex, tileById };
}

/**
 * Find and return the mirror tile for a given tile in specified direction
 */
export function findMirrorTile(
  currentTile: TileData,
  direction: 'horizontal' | 'vertical',
  relationships: TileRelationships
): TileData | null {
  
  const mirrorInfo = relationships.mirrorMap.get(currentTile.id);
  if (!mirrorInfo) {
    console.log(`⚠️ No mirror info found for tile: ${currentTile.id}`);
    return null;
  }

  const mirrorId = direction === 'horizontal' ? mirrorInfo.horizontal : mirrorInfo.vertical;
  if (!mirrorId) {
    console.log(`⚠️ No ${direction} mirror found for tile: ${currentTile.id}`);
    return null;
  }

  const mirrorTile = relationships.tileById.get(mirrorId);
  if (!mirrorTile) {
    console.log(`⚠️ Mirror tile not found: ${mirrorId}`);
    return null;
  }

  console.log(`🪞 Found ${direction} mirror: ${currentTile.id} -> ${mirrorTile.id}`);
  return mirrorTile;
}

/**
 * Find all tiles in the same rotation family (same shape, different rotations)
 */
export function findRotationFamily(
  currentTile: TileData,
  relationships: TileRelationships
): TileData[] {
  
  // Get the rotation IDs from the tile
  const rotationIds = [
    currentTile.rotation0,
    currentTile.rotation90,
    currentTile.rotation180,
    currentTile.rotation270
  ];
  
  // Find the actual tiles for each rotation
  const rotationFamily: TileData[] = [];
  rotationIds.forEach(id => {
    if (id) {
      const tile = relationships.tileById.get(id);
      if (tile) {
        rotationFamily.push(tile);
      }
    }
  });
  
  console.log(`🔄 Found ${rotationFamily.length} rotation variants for tile: ${currentTile.id}`);
  return rotationFamily;
}