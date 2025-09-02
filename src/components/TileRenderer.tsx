'use client';

import React from 'react';
import { ColorScheme } from './ColorPalette';

interface TileProps {
  id: string;
  edge1: string;
  edge2: string;
  edge3: string;
  edge4: string;
  rotation: string;
  shape: string;
  size?: number;
  customColors?: ColorScheme;
}

const TileRenderer: React.FC<TileProps> = ({ 
  id, 
  edge1, 
  edge2, 
  edge3, 
  edge4, 
  rotation, 
  shape,
  size = 100,
  customColors
}) => {
  const getColor = (edge: string) => {
    if (customColors) {
      switch (edge) {
        case 'a': return customColors.a;
        case 'b': return customColors.b;
        case 'c': return customColors.c;
        default: return '#666';
      }
    }
    
    // Default colors
    switch (edge) {
      case 'a': return '#8B5A3C'; // Brown
      case 'b': return '#5B8DBF'; // Blue
      case 'c': return '#D4A574'; // Beige
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
  const rotationAngle = getRotationAngle(rotation);

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
        <div className="text-gray-400">{edges.join('-')} {rotation}</div>
      </div>
    </div>
  );
};

export default TileRenderer;