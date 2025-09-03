/**
 * PATTERN FUNCTION POPUP - Simplified UI as a popup
 * Only essential functions: fillGrid and optimizeEdgeMatching
 */

import React, { useState } from 'react';
import { TileData } from './CSVTable';
import { fillGrid, optimizeEdgeMatching, GridCell, FunctionResult } from './CoreFunctions';

interface PatternFunctionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  grid: GridCell[];
  allTiles: TileData[];
  onGridUpdate: (newGrid: GridCell[]) => void;
  gridWidth?: number;
  gridHeight?: number;
}

interface FunctionButton {
  name: string;
  displayName: string;
  description: string;
  icon: string;
  action: () => FunctionResult;
}

export const PatternFunctionPopup: React.FC<PatternFunctionPopupProps> = ({
  isOpen,
  onClose,
  grid,
  allTiles,
  onGridUpdate,
  gridWidth = 12,
  gridHeight = 8
}) => {
  const [lastResult, setLastResult] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  // Define our two essential functions
  const FUNCTIONS: FunctionButton[] = [
    {
      name: 'fillGrid',
      displayName: 'Fill All Tiles',
      description: 'Fill grid with all 96 tiles, each used exactly once',
      icon: '📦',
      action: () => {
        const newGrid = fillGrid(grid, allTiles);
        onGridUpdate(newGrid);
        const filledCount = newGrid.filter(c => c.tile).length;
        return {
          success: true,
          message: `Filled ${filledCount} tiles (all unique)`,
          gridState: newGrid
        };
      }
    },
    {
      name: 'optimizeEdgeMatching',
      displayName: 'Edge Matching',
      description: 'Create beautiful patterns with edge matching',
      icon: '🎨',
      action: () => {
        const newGrid = optimizeEdgeMatching(grid);
        onGridUpdate(newGrid);
        return {
          success: true,
          message: 'Edge matching complete',
          gridState: newGrid
        };
      }
    }
  ];

  const executeFunction = async (func: FunctionButton) => {
    setIsProcessing(true);
    try {
      const result = func.action();
      setLastResult(result.message);
      console.log(`✅ ${func.displayName}: ${result.message}`);
    } catch (error) {
      const errorMsg = `Error in ${func.displayName}: ${error}`;
      setLastResult(errorMsg);
      console.error(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Popup */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 
                      w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="bg-purple-900 text-white p-6 rounded-lg shadow-2xl">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-purple-100">
              Pattern Functions
            </h2>
            <button
              onClick={onClose}
              className="text-purple-300 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          {/* Function Buttons */}
          <div className="grid grid-cols-1 gap-3 mb-4">
            {FUNCTIONS.map((func) => (
              <button
                key={func.name}
                onClick={() => executeFunction(func)}
                disabled={isProcessing}
                className={`
                  flex items-center gap-3 p-4 rounded-lg
                  bg-purple-800 hover:bg-purple-700
                  transition-all duration-200 text-left
                  ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  hover:scale-[1.02] active:scale-[0.98]
                `}
              >
                <span className="text-2xl">{func.icon}</span>
                <div className="flex-1">
                  <div className="font-semibold text-purple-100">
                    {func.displayName}
                  </div>
                  <div className="text-sm text-purple-300">
                    {func.description}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Result Display */}
          {lastResult && (
            <div className="mt-4 p-3 bg-purple-800 rounded-lg">
              <div className="text-sm text-purple-200">Last Result:</div>
              <div className="text-purple-100">{lastResult}</div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-4 p-3 bg-purple-950 rounded text-purple-300 text-sm">
            <p>1. Click "Fill All Tiles" to place all 96 unique tiles</p>
            <p>2. Click "Edge Matching" to optimize patterns</p>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="mt-4 w-full py-2 bg-purple-700 hover:bg-purple-600 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};

// Default export for compatibility
export default PatternFunctionPopup;