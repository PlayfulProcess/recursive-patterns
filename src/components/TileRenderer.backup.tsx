'use client';

import React from 'react';
import { ColorScheme } from './ColorPalette';
import { TileData } from './CSVTable';

interface TileProps {
  tile: TileData;
  size?: number;
  customColors?: ColorScheme;
  seamless?: boolean; // Hide labels and borders for grid display
}

const TileRenderer: React.FC<TileProps> = ({ 
  tile,
  size = 100,
  customColors,
  seamless = false
}) => {
  // Handle case where tile is undefined
  if (!tile) {
    return <div className="w-full h-full bg-red-500 flex items-center justify-center text-white text-xs">No Tile</div>;
  }

  const { id, edge1, edge2, edge3, edge4, shape } = tile;
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

  // Direct edge mapping - based on visual observation:
  // edge-S appears on right, edge-W appears on bottom
  // So: edge1(S)=Right, edge2(W)=Bottom, edge3(N)=Left, edge4(E)=Top
  const edges = [edge4, edge1, edge2, edge3]; // [Top, Right, Bottom, Left] for SVG rendering

  if (seamless) {
    // Seamless mode for grid display - no borders, labels, or containers
    return (
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 100 100" 
        className="block"
      >
        {/* Top triangle (edge-E) */}
        <polygon 
          points="0,0 100,0 50,50" 
          fill={getColor(edges[0])}
        />
        {/* Right triangle (edge-S) */}
        <polygon 
          points="100,0 100,100 50,50" 
          fill={getColor(edges[1])}
        />
        {/* Bottom triangle (edge-W) */}
        <polygon 
          points="100,100 0,100 50,50" 
          fill={getColor(edges[2])}
        />
        {/* Left triangle (edge-N) */}
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
          height: size
        }}
      >
        <svg width={size} height={size} viewBox="0 0 100 100">
          {/* Top triangle (edge-E) */}
          <polygon 
            points="0,0 100,0 50,50" 
            fill={getColor(edges[0])}
          />
          {/* Right triangle (edge-S) */}
          <polygon 
            points="100,0 100,100 50,50" 
            fill={getColor(edges[1])}
          />
          {/* Bottom triangle (edge-W) */}
          <polygon 
            points="100,100 0,100 50,50" 
            fill={getColor(edges[2])}
          />
          {/* Left triangle (edge-N) */}
          <polygon 
            points="0,100 0,0 50,50" 
            fill={getColor(edges[3])}
          />
        </svg>
      </div>
      <div className="text-xs text-center">
        <div className="font-mono text-white">{id}</div>
        <div className="text-gray-400">{edges.join('-')} Shape:{shape}</div>
      </div>
    </div>
  );
};

export default TileRenderer;