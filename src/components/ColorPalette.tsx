'use client';

import React from 'react';

export interface ColorScheme {
  a: string;
  b: string;
  c: string;
}

interface ColorPaletteProps {
  selectedColors: ColorScheme;
  onColorChange: (edge: 'a' | 'b' | 'c', color: string) => void;
}

const ColorPalette: React.FC<ColorPaletteProps> = ({ selectedColors, onColorChange }) => {
  const predefinedColors = [
    '#8B5A3C', // Original Brown
    '#5B8DBF', // Original Blue  
    '#D4A574', // Original Beige
    '#E74C3C', // Red
    '#2ECC71', // Green
    '#9B59B6', // Purple
    '#F39C12', // Orange
    '#34495E', // Dark Gray
    '#1ABC9C', // Turquoise
    '#F1C40F', // Yellow
    '#95A5A6', // Light Gray
    '#E67E22', // Dark Orange
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-8">
      <h3 className="text-white text-lg font-bold mb-4">Color Customization</h3>
      <div className="grid grid-cols-3 gap-6">
        {(['a', 'b', 'c'] as const).map((edge) => (
          <div key={edge} className="text-center">
            <h4 className="text-gray-300 text-sm font-medium mb-3">
              Edge {edge.toUpperCase()}
            </h4>
            <div className="flex flex-wrap gap-2 justify-center">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  onClick={() => onColorChange(edge, color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                    selectedColors[edge] === color
                      ? 'border-white ring-2 ring-blue-400'
                      : 'border-gray-600 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <div className="mt-3">
              <input
                type="color"
                value={selectedColors[edge]}
                onChange={(e) => onColorChange(edge, e.target.value)}
                className="w-12 h-8 rounded border-2 border-gray-600 bg-transparent cursor-pointer"
                title="Custom color picker"
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Reset to defaults button */}
      <div className="mt-6 text-center">
        <button
          onClick={() => {
            onColorChange('a', '#8B5A3C');
            onColorChange('b', '#5B8DBF');
            onColorChange('c', '#D4A574');
          }}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
        >
          Reset to Original Colors
        </button>
      </div>
    </div>
  );
};

export default ColorPalette;