'use client';

import React, { useState, useRef, useEffect } from 'react';
import { TileData } from './CSVTable';
import { AIPatternFunctions } from './AIPatternFunctions';

interface GridCell {
  x: number;
  y: number;
  tile?: TileData;
  rotation?: number;
}

interface PatternFunctionPanelProps {
  grid: GridCell[];
  allTiles: TileData[];
  onGridUpdate: (newGrid: GridCell[]) => void;
  onFunctionExecute?: (functionName: string, result: any) => void;
}

interface FunctionButton {
  name: string;
  displayName: string;
  description: string;
  category: 'edge-matching' | 'organization' | 'analysis' | 'utility';
  icon: string;
}

const AVAILABLE_FUNCTIONS: FunctionButton[] = [
  // Edge Matching Functions
  {
    name: 'optimizeEdgeMatching',
    displayName: 'Optimize Edges',
    description: 'Smart initial tile placement based on edge score analysis',
    category: 'edge-matching',
    icon: '🎯'
  },
  {
    name: 'buildLateralEdges', 
    displayName: 'Horizontal Chains',
    description: 'Create horizontal chains with matching lateral edges',
    category: 'edge-matching',
    icon: '↔️'
  },
  {
    name: 'buildBottomEdges',
    displayName: 'Vertical Chains', 
    description: 'Create vertical chains with matching bottom edges',
    category: 'edge-matching',
    icon: '↕️'
  },
  {
    name: 'createBeautifulPattern',
    displayName: 'Complete Pattern',
    description: 'Run full Beautiful Edge Matching algorithm',
    category: 'edge-matching',
    icon: '🌟'
  },

  // Organization Functions
  {
    name: 'fillGrid',
    displayName: 'Fill Grid',
    description: 'Fill empty cells with all available tiles',
    category: 'organization',
    icon: '📋'
  },
  {
    name: 'shuffleGrid',
    displayName: 'Shuffle All',
    description: 'Randomly redistribute all tiles with rotations',
    category: 'organization',
    icon: '🔀'
  },
  {
    name: 'clearGrid',
    displayName: 'Clear All',
    description: 'Remove all tiles from the grid',
    category: 'organization',
    icon: '🗑️'
  },
  {
    name: 'rotateAllTiles',
    displayName: 'Rotate All',
    description: 'Apply random rotations to all placed tiles',
    category: 'organization',
    icon: '🔄'
  },

  // Analysis Functions
  {
    name: 'findDuplicates',
    displayName: 'Find Duplicates',
    description: 'Highlight duplicate tiles across the entire grid',
    category: 'analysis',
    icon: '🔍'
  },
  {
    name: 'logEdgeSignatures',
    displayName: 'Debug Edges',
    description: 'Log edge signatures for pattern debugging',
    category: 'analysis',
    icon: '🔬'
  },
  {
    name: 'analyzeConnections',
    displayName: 'Analyze Grid',
    description: 'Count edge matches and pattern quality',
    category: 'analysis',
    icon: '📊'
  },

  // Utility Functions
  {
    name: 'pairRotationFamilies',
    displayName: 'Group Rotations',
    description: 'Organize tiles by rotation families',
    category: 'utility',
    icon: '🔄'
  },
  {
    name: 'pairMirrorFamilies',
    displayName: 'Group Mirrors',
    description: 'Organize tiles by mirror families', 
    category: 'utility',
    icon: '🪞'
  },
  {
    name: 'removeDuplicates',
    displayName: 'Fix Duplicates',
    description: 'Replace duplicates with missing tiles automatically',
    category: 'utility',
    icon: '🔧'
  }
];

export default function PatternFunctionPanel({
  grid,
  allTiles,
  onGridUpdate,
  onFunctionExecute
}: PatternFunctionPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [executingFunction, setExecutingFunction] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string>('');
  const aiPatternFunctionsRef = useRef<AIPatternFunctions | null>(null);

  // Initialize AI pattern functions
  useEffect(() => {
    aiPatternFunctionsRef.current = new AIPatternFunctions(
      grid,
      allTiles,
      onGridUpdate,
      12, // gridWidth
      8   // gridHeight
    );
  }, [allTiles, onGridUpdate]);

  // Update functions when grid changes
  useEffect(() => {
    if (aiPatternFunctionsRef.current) {
      aiPatternFunctionsRef.current.updateGrid(grid);
    }
  }, [grid]);

  const executeFunction = async (functionName: string): Promise<any> => {
    setExecutingFunction(functionName);
    console.log(`🔧 Manual execution: ${functionName}`);

    try {
      let result: any = { success: false, message: 'Function not implemented' };

      // Check if it's an edge matching function that should use AI pattern functions
      const edgeMatchingFunctions = [
        'optimizeEdgeMatching', 'buildLateralEdges', 'buildBottomEdges', 
        'createBeautifulPattern', 'logEdgeSignatures'
      ];

      if (edgeMatchingFunctions.includes(functionName) && aiPatternFunctionsRef.current) {
        result = await aiPatternFunctionsRef.current.executeFunction(functionName);
      } else {
        // Handle other functions locally
        switch (functionName) {
          case 'fillGrid':
            result = fillGrid();
            break;
          case 'shuffleGrid':
            result = shuffleGrid();
            break;
          case 'clearGrid':
            result = clearGrid();
            break;
          case 'rotateAllTiles':
            result = rotateAllTiles();
            break;
          case 'findDuplicates':
            result = findDuplicates();
            break;
          case 'removeDuplicates':
          case 'analyzeConnections':
          case 'pairRotationFamilies':
          case 'pairMirrorFamilies':
            // These use AI pattern functions
            if (aiPatternFunctionsRef.current) {
              result = await aiPatternFunctionsRef.current.executeFunction(functionName);
            } else {
              result = { success: false, message: 'AI pattern functions not initialized' };
            }
            break;
          default:
            result = { success: false, message: `Function ${functionName} not implemented` };
        }
      }

      setLastResult(result.message || `${functionName} completed`);
      if (onFunctionExecute) {
        onFunctionExecute(functionName, result);
      }

      return result;
    } catch (error) {
      const errorResult = { success: false, message: `Error: ${error}` };
      setLastResult(errorResult.message);
      return errorResult;
    } finally {
      setExecutingFunction(null);
    }
  };

  // Function implementations
  const fillGrid = () => {
    if (allTiles.length === 0) {
      return { success: false, message: 'No tiles available to fill grid' };
    }

    const newGrid = [...grid];
    const shuffledTiles = [...allTiles].sort(() => Math.random() - 0.5);
    let tileIndex = 0;

    for (let i = 0; i < newGrid.length && tileIndex < shuffledTiles.length; i++) {
      newGrid[i] = {
        ...newGrid[i],
        tile: shuffledTiles[tileIndex],
        rotation: Math.floor(Math.random() * 4) * 90
      };
      tileIndex++;
    }

    onGridUpdate(newGrid);
    return { 
      success: true, 
      message: `Grid filled with ${Math.min(newGrid.length, shuffledTiles.length)} diverse tiles` 
    };
  };

  const shuffleGrid = () => {
    const newGrid = [...grid];
    const tilesWithPositions = newGrid
      .map((cell, index) => ({ cell, index }))
      .filter(item => item.cell.tile);

    // Shuffle the tiles
    const shuffledTiles = tilesWithPositions
      .map(item => ({ tile: item.cell.tile, rotation: Math.floor(Math.random() * 4) * 90 }))
      .sort(() => Math.random() - 0.5);

    // Redistribute
    tilesWithPositions.forEach((item, i) => {
      if (shuffledTiles[i]) {
        newGrid[item.index] = {
          ...newGrid[item.index],
          tile: shuffledTiles[i].tile,
          rotation: shuffledTiles[i].rotation
        };
      }
    });

    onGridUpdate(newGrid);
    return { success: true, message: `Shuffled ${tilesWithPositions.length} tiles with new rotations` };
  };

  const clearGrid = () => {
    const newGrid = grid.map(cell => ({ x: cell.x, y: cell.y }));
    onGridUpdate(newGrid);
    return { success: true, message: 'Grid cleared - all tiles removed' };
  };

  const rotateAllTiles = () => {
    const newGrid = grid.map(cell => 
      cell.tile 
        ? { ...cell, rotation: Math.floor(Math.random() * 4) * 90 }
        : cell
    );
    onGridUpdate(newGrid);
    const rotatedCount = newGrid.filter(cell => cell.tile).length;
    return { success: true, message: `Applied random rotations to ${rotatedCount} tiles` };
  };

  const findDuplicates = () => {
    const tileMap = new Map<string, number[]>();
    
    grid.forEach((cell, index) => {
      if (cell.tile) {
        const key = `${cell.tile.name}-${cell.rotation || 0}`;
        if (!tileMap.has(key)) {
          tileMap.set(key, []);
        }
        tileMap.get(key)!.push(index);
      }
    });

    const duplicates = Array.from(tileMap.entries())
      .filter(([_, positions]) => positions.length > 1);

    const totalDuplicates = duplicates.reduce((sum, [_, positions]) => sum + positions.length - 1, 0);

    return { 
      success: true, 
      message: `Found ${totalDuplicates} duplicate tiles in ${duplicates.length} groups`,
      data: { duplicates, tileMap }
    };
  };

  const removeDuplicates = () => {
    const duplicateResult = findDuplicates();
    if (!duplicateResult.data?.duplicates.length) {
      return { success: true, message: 'No duplicates found to remove' };
    }

    // This is a placeholder - would need more sophisticated logic
    return { 
      success: false, 
      message: 'Duplicate removal requires tile availability analysis - use AI function instead' 
    };
  };

  const analyzeConnections = () => {
    let totalConnections = 0;
    let possibleConnections = 0;

    // Count horizontal connections
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 11; x++) {
        const pos1 = y * 12 + x;
        const pos2 = y * 12 + x + 1;
        
        if (grid[pos1]?.tile && grid[pos2]?.tile) {
          possibleConnections++;
          // This would need actual edge matching logic
        }
      }
    }

    // Count vertical connections
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 12; x++) {
        const pos1 = y * 12 + x;
        const pos2 = (y + 1) * 12 + x;
        
        if (grid[pos1]?.tile && grid[pos2]?.tile) {
          possibleConnections++;
        }
      }
    }

    const placedTiles = grid.filter(cell => cell.tile).length;
    const connectionRate = possibleConnections > 0 ? (totalConnections / possibleConnections * 100) : 0;

    return {
      success: true,
      message: `Grid analysis: ${placedTiles} tiles placed, ${totalConnections}/${possibleConnections} connections (${connectionRate.toFixed(1)}%)`
    };
  };

  // Removed pairRotationFamilies and pairMirrorFamilies - now handled by AI pattern functions

  const categories = ['edge-matching', 'organization', 'analysis', 'utility'] as const;
  const categoryNames = {
    'edge-matching': '🎨 Edge Matching',
    'organization': '📋 Organization', 
    'analysis': '🔬 Analysis',
    'utility': '🛠️ Utilities'
  };

  return (
    <div className="fixed bottom-4 left-4 z-40">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 mb-2"
        title="Pattern Functions"
      >
        <div className="flex items-center justify-center w-8 h-8">
          {isExpanded ? '✕' : '⚡'}
        </div>
      </button>

      {/* Function Panel */}
      {isExpanded && (
        <div className="bg-gray-900 text-white rounded-lg shadow-2xl p-4 w-80 max-h-96 overflow-y-auto border border-gray-700">
          <h3 className="text-lg font-semibold mb-3 text-purple-400">Pattern Functions</h3>
          
          {lastResult && (
            <div className="mb-3 p-2 bg-gray-800 rounded text-xs text-green-400">
              {lastResult}
            </div>
          )}

          {categories.map(category => (
            <div key={category} className="mb-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">
                {categoryNames[category]}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_FUNCTIONS.filter(fn => fn.category === category).map(fn => (
                  <button
                    key={fn.name}
                    onClick={() => executeFunction(fn.name)}
                    disabled={executingFunction === fn.name}
                    className={`p-2 rounded text-xs font-medium transition-all duration-150 ${
                      executingFunction === fn.name
                        ? 'bg-yellow-600 text-yellow-100'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                    }`}
                    title={fn.description}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <span className="text-sm">{fn.icon}</span>
                      <span className="text-xs leading-tight text-center">
                        {fn.displayName}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-700">
            💡 AI can call all these functions. Click buttons to execute manually.
          </div>
        </div>
      )}
    </div>
  );
}