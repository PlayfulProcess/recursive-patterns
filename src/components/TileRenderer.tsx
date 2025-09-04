'use client';

import React from 'react';
import { ColorScheme } from './ColorPalette';
import { TileData } from './CSVTable';

interface TileProps {
  tile: TileData;
  size?: number;
  customColors?: ColorScheme;
  rotation?: number; // Override rotation in degrees
  seamless?: boolean; // Hide labels and borders for grid display
}

const TileRenderer: React.FC<TileProps> = ({ 
  tile,
  size = 100,
  customColors,
  rotation: customRotation,
  seamless = false
}) => {
  // Handle case where tile is undefined
  if (!tile) {
    return <div className="w-full h-full bg-red-500 flex items-center justify-center text-white text-xs">No Tile</div>;
  }

  const { id, edge1, edge2, edge3, edge4, rotation: tileRotation } = tile;
  const getColor = (edge: string) => {
    if (customColors) {
      switch (edge) {
        case 'a': return customColors.a;
        case 'b': return customColors.b;
        case 'c': return customColors.c;
        case 'd': return customColors.d;
        default: return '#666';
      }
    }
    
    // Default colors (matching reference project)
    switch (edge) {
      case 'a': return '#E8B4B8'; // Pink
      case 'b': return '#6B9BD1'; // Blue
      case 'c': return '#C8B094'; // Beige
      case 'd': return '#F5F1E8'; // Cream
      default: return '#666';
    }
  };

  const getRotationAngle = (rotation: string) => {
    switch (rotation) {
      case 'N': return 0;
      case 'E': return 90;
      case 'S': return 180;
      case 'W': return 270;
      default: return 0;
    }
  };

  // Map edges to proper positions: S=Top, W=Left, N=Bottom, E=Right
  const edges = [edge1, edge4, edge3, edge2]; // [S, E, N, W] -> [Top, Right, Bottom, Left]
  const rotationAngle = customRotation !== undefined ? customRotation : getRotationAngle(tileRotation);

  if (seamless) {
    // Seamless mode for grid display - no borders, labels, or containers
    return (
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 100 100" 
        className="block"
        style={{ transform: `rotate(${rotationAngle}deg)` }}
      >
        {/* Top triangle (South edge) */}
        <polygon 
          points="0,0 100,0 50,50" 
          fill={getColor(edges[0])}
        />
        {/* Right triangle (East edge) */}
        <polygon 
          points="100,0 100,100 50,50" 
          fill={getColor(edges[1])}
        />
        {/* Bottom triangle (North edge) */}
        <polygon 
          points="100,100 0,100 50,50" 
          fill={getColor(edges[2])}
        />
        {/* Left triangle (West edge) */}
        <polygon 
          points="0,100 0,0 50,50" 
          fill={getColor(edges[3])}
        />
      </svg>
    );
  }

  // Standard mode with labels and borders
  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        className="relative border border-gray-300"
        style={{ 
          width: size, 
          height: size,
          transform: `rotate(${rotationAngle}deg)`
        }}
      >
        <svg width={size} height={size} viewBox="0 0 100 100">
          {/* Top triangle (South edge) */}
          <polygon 
            points="0,0 100,0 50,50" 
            fill={getColor(edges[0])}
          />
          {/* Right triangle (East edge) */}
          <polygon 
            points="100,0 100,100 50,50" 
            fill={getColor(edges[1])}
          />
          {/* Bottom triangle (North edge) */}
          <polygon 
            points="100,100 0,100 50,50" 
            fill={getColor(edges[2])}
          />
          {/* Left triangle (West edge) */}
          <polygon 
            points="0,100 0,0 50,50" 
            fill={getColor(edges[3])}
          />
        </svg>
      </div>
      <div className="text-xs text-center">
        <div className="font-mono text-white">{id}</div>
        <div className="text-gray-400">{edges.join('-')} {tileRotation}</div>
      </div>
    </div>
  );
};

export default TileRenderer;