'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import TileRenderer from '@/components/TileRenderer';
import TileSelector from '@/components/TileSelector';
import { TileData } from '@/components/CSVTable';
import { ColorScheme } from '@/components/ColorPalette';
import { 
  fillGrid, 
  optimizeEdgeMatching,
  buildTileRelationships,
  findMirrorTile,
  findRotationFamily,
  findEdgeMatches,
  TileRelationships,
  calculatePatternScore,
  findAllMirrorPairs,
  iterativeImprove,
  GridCell,
  exportGridToCSV,
  importGridFromCSV,
  downloadCSV,
  validateCSVFile,
  optimizeGridConfigurable,
  optimizeWithPreset,
  optimizeForSingleColor,
  OPTIMIZATION_PRESETS,
  OptimizationResult
} from '../lib/coreFunctions';
import { maximizeEdgeMatching, calculateTotalScore } from '@/lib/maxEdgeMatching';

interface MainGridEnhancedProps {
  allTiles: TileData[];
  customColors: ColorScheme;
  grid?: GridCell[];
  onGridUpdate?: (newGrid: GridCell[]) => void;
  selectedTileFromTable?: TileData;
  filteredTiles?: {
    tiles: TileData[];
    shouldHighlight: boolean;
  };
  onRenderInMiniPlayground?: (tile: TileData, x: number, y: number) => void;
}

// Context Menu Component
interface ContextMenuProps {
  x: number;
  y: number;
  tile: TileData;
  gridX: number;
  gridY: number;
  onRenderInMiniPlayground?: (tile: TileData, x: number, y: number) => void;
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ 
  x, 
  y, 
  tile, 
  gridX, 
  gridY, 
  onRenderInMiniPlayground, 
  onClose 
}) => {
  useEffect(() => {
    const handleClickOutside = () => onClose();
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  return (
    <div 
      className="fixed bg-gray-800 border border-gray-600 rounded-lg shadow-lg py-2 z-50"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-4 py-2 text-gray-300 text-sm border-b border-gray-600">
        Tile: {tile.id} at {String.fromCharCode(65 + gridX)}{gridY + 1}
      </div>
      {onRenderInMiniPlayground && (
        <button
          onClick={() => {
            onRenderInMiniPlayground(tile, gridX, gridY);
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 text-sm flex items-center gap-2"
        >
          <span>🎨</span>
          Render in Mini Playground
        </button>
      )}
      <button
        onClick={onClose}
        className="w-full px-4 py-2 text-left text-gray-400 hover:bg-gray-700 text-sm"
      >
        Cancel
      </button>
    </div>
  );
};

export default function MainGridEnhanced({ allTiles, customColors, grid: externalGrid, onGridUpdate, selectedTileFromTable, filteredTiles, onRenderInMiniPlayground }: MainGridEnhancedProps) {
  const [internalGrid, setInternalGrid] = useState<GridCell[]>(() => {
    const cells: GridCell[] = [];
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 12; x++) {
        cells.push({ x, y });
      }
    }
    return cells;
  });

  // Use external grid if provided, otherwise use internal
  const grid = externalGrid || internalGrid;
  const setGrid = (newGrid: GridCell[]) => {
    if (onGridUpdate) {
      onGridUpdate(newGrid); // Update external state
    } else {
      setInternalGrid(newGrid); // Update internal state
    }
  };
  
  const [duplicates, setDuplicates] = useState<Set<string>>(new Set());
  const [showDuplicates, setShowDuplicates] = useState(false);

  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [focusedCell, setFocusedCell] = useState<GridCell | null>(null);
  const [showTileSelector, setShowTileSelector] = useState(false);
  const [draggedTiles, setDraggedTiles] = useState<Map<string, { tile: TileData, rotation: number }>>(new Map());
  const [draggedFromCells, setDraggedFromCells] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dropTargetCell, setDropTargetCell] = useState<GridCell | null>(null);
  const [lastSelectedCell, setLastSelectedCell] = useState<GridCell | null>(null);
  const [tileRelationships, setTileRelationships] = useState<TileRelationships | null>(null);
  const [testMessage, setTestMessage] = useState<string>('');
  const [highlightedTiles, setHighlightedTiles] = useState<Set<string>>(new Set());
  const [highlightType, setHighlightType] = useState<string>('');
  const [showTileIDs, setShowTileIDs] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [optimizationProgress, setOptimizationProgress] = useState<string>('');
  const gridRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [patternAnalysis, setPatternAnalysis] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<string>('classic');
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [showCustomWeights, setShowCustomWeights] = useState<boolean>(false);
  const [customWeights, setCustomWeights] = useState({
    edgeMatching: 10,
    mirrorBonus: 100,
    rotationBonus: 50,
    colorPriority: { a: 1, b: 1, c: 1, d: 1 },
    shapeCluster: 20,
    distancePenalty: 1
  });
  const [selectedTraversal, setSelectedTraversal] = useState<string>('row-major');
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    tile: TileData;
    gridX: number;
    gridY: number;
  } | null>(null);

  // Sync external grid changes to internal state
  useEffect(() => {
    if (externalGrid && externalGrid !== internalGrid) {
      setInternalGrid([...externalGrid]);
    }
  }, [externalGrid]);

  // Build tile relationships when tiles are loaded
  useEffect(() => {
    if (allTiles.length > 0 && !tileRelationships) {
      const relationships = buildTileRelationships(allTiles);
      setTileRelationships(relationships);
    }
  }, [allTiles, tileRelationships]);


  // Handle highlighting when a tile is selected from the table
  useEffect(() => {
    if (selectedTileFromTable) {
      // Find all positions of this tile in the grid
      const tilePositions = findTilePositions([selectedTileFromTable.id]);
      if (tilePositions.length > 0) {
        setHighlightedTiles(new Set(tilePositions));
        setHighlightType('table-selected');
        setTestMessage(`📋 Selected from table: ${selectedTileFromTable.id} (highlighted in purple)`);
      }
    }
  }, [selectedTileFromTable]);

  // Handle highlighting filtered tiles from CSV table
  useEffect(() => {
    if (filteredTiles?.shouldHighlight && filteredTiles.tiles.length > 0) {
      // Find all positions of filtered tiles in the grid
      const tileIds = filteredTiles.tiles.map(tile => tile.id);
      const tilePositions = findTilePositions(tileIds);
      if (tilePositions.length > 0) {
        setHighlightedTiles(new Set(tilePositions));
        setHighlightType('filtered-tiles');
        setTestMessage(`🔍 Filter applied: ${filteredTiles.tiles.length} tiles highlighted (${tilePositions.length} positions in grid)`);
        setTimeout(() => setTestMessage(''), 4000);
      }
    } else if (filteredTiles?.shouldHighlight === false) {
      // Clear highlights when filter highlight is turned off
      clearHighlights();
    }
  }, [filteredTiles]);

  // Helper function to get cell key
  const getCellKey = (cell: GridCell) => `${cell.x}-${cell.y}`;
  
  // Helper function to get cell from key
  const getCellFromKey = (key: string): GridCell | null => {
    const [x, y] = key.split('-').map(Number);
    return grid.find(c => c.x === x && c.y === y) || null;
  };

  // Helper function to find all positions of tiles with specific IDs
  const findTilePositions = (tileIds: string[]): string[] => {
    const positions: string[] = [];
    grid.forEach((cell, index) => {
      if (cell.tile && tileIds.includes(cell.tile.id)) {
        positions.push(getCellKey(cell));
      }
    });
    return positions;
  };

  // Helper function to clear highlights
  const clearHighlights = () => {
    setHighlightedTiles(new Set());
    setHighlightType('');
  };

  // Helper function to get selected tile info
  const getSelectedTileInfo = () => {
    if (selectedCells.size === 1) {
      const selectedCell = getCellFromKey(Array.from(selectedCells)[0]);
      if (selectedCell?.tile) {
        return {
          id: selectedCell.tile.id,
          position: `${selectedCell.x}-${selectedCell.y}`
        };
      }
    }
    return null;
  };

  // Helper function to get highlight style based on type
  const getHighlightStyle = (type: string): string => {
    if (type.startsWith('mirror')) {
      return '!ring-8 !ring-green-500 !ring-inset !bg-green-500 !bg-opacity-80 !z-50 !relative !border-4 !border-green-400';
    } else if (type === 'rotation') {
      return '!ring-8 !ring-blue-500 !ring-inset !bg-blue-500 !bg-opacity-80 !z-50 !relative !border-4 !border-blue-400';
    } else if (type.startsWith('edge')) {
      return '!ring-8 !ring-orange-500 !ring-inset !bg-orange-500 !bg-opacity-80 !z-50 !relative !border-4 !border-orange-400';
    }
    return '!ring-8 !ring-purple-500 !ring-inset !bg-purple-500 !bg-opacity-80 !z-50 !relative !border-4 !border-purple-400';
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!focusedCell) return;

      let newX = focusedCell.x;
      let newY = focusedCell.y;
      let handled = false;

      switch (e.key) {
        case 'ArrowUp':
          newY = Math.max(0, focusedCell.y - 1);
          handled = true;
          break;
        case 'ArrowDown':
          newY = Math.min(7, focusedCell.y + 1);
          handled = true;
          break;
        case 'ArrowLeft':
          newX = Math.max(0, focusedCell.x - 1);
          handled = true;
          break;
        case 'ArrowRight':
          newX = Math.min(11, focusedCell.x + 1);
          handled = true;
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          const cell = grid.find(c => c.x === focusedCell.x && c.y === focusedCell.y);
          if (cell) {
            handleCellClick(cell, e.shiftKey, e.ctrlKey || e.metaKey);
          }
          handled = true;
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          handleDeleteSelected();
          handled = true;
          break;
        case 'a':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            selectAll();
            handled = true;
          }
          break;
        case 'Escape':
          setSelectedCells(new Set());
          handled = true;
          break;
      }

      if (handled) {
        e.preventDefault();
        const newCell = grid.find(c => c.x === newX && c.y === newY);
        if (newCell && (newX !== focusedCell.x || newY !== focusedCell.y)) {
          setFocusedCell(newCell);
          
          if (e.shiftKey && lastSelectedCell) {
            selectRange(lastSelectedCell, newCell);
          } else if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
            setSelectedCells(new Set([getCellKey(newCell)]));
            setLastSelectedCell(newCell);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedCell, grid, lastSelectedCell]);

  const handleCellClick = (cell: GridCell, shiftKey: boolean, ctrlKey: boolean) => {
    const cellKey = getCellKey(cell);
    
    // Close context menu if open
    setContextMenu(null);
    
    // Clear highlights when selecting new cells (unless holding modifiers for multi-select)
    if (!ctrlKey) {
      clearHighlights();
    }
    
    if (shiftKey && lastSelectedCell) {
      // Select range from last selected to current
      selectRange(lastSelectedCell, cell);
    } else if (ctrlKey) {
      // Toggle selection
      const newSelection = new Set(selectedCells);
      if (newSelection.has(cellKey)) {
        newSelection.delete(cellKey);
      } else {
        newSelection.add(cellKey);
      }
      setSelectedCells(newSelection);
      setLastSelectedCell(cell);
    } else {
      // Single selection
      setSelectedCells(new Set([cellKey]));
      setLastSelectedCell(cell);
    }
    
    setFocusedCell(cell);
    
    if (!cell.tile && !shiftKey && !ctrlKey) {
      setShowTileSelector(true);
    }
  };

  const handleCellRightClick = (e: React.MouseEvent, cell: GridCell) => {
    e.preventDefault();
    
    // Only show context menu if cell has a tile
    if (cell.tile) {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        tile: cell.tile,
        gridX: cell.x,
        gridY: cell.y
      });
    }
  };

  const selectRange = (from: GridCell, to: GridCell) => {
    const minX = Math.min(from.x, to.x);
    const maxX = Math.max(from.x, to.x);
    const minY = Math.min(from.y, to.y);
    const maxY = Math.max(from.y, to.y);
    
    const newSelection = new Set<string>();
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        newSelection.add(`${x}-${y}`);
      }
    }
    setSelectedCells(newSelection);
  };

  const selectAll = () => {
    const allCellKeys = grid.map(cell => getCellKey(cell));
    setSelectedCells(new Set(allCellKeys));
  };

  const handleDeleteSelected = () => {
    const newGrid = grid.map(cell => {
      if (selectedCells.has(getCellKey(cell))) {
        return { ...cell, tile: undefined, rotation: undefined };
      }
      return cell;
    });
    setGrid(newGrid);
    setSelectedCells(new Set());
  };

  const handleTileSelect = (tile: TileData, rotation: number) => {
    // Place tile in all selected cells
    const newGrid = grid.map(cell => {
      if (selectedCells.has(getCellKey(cell))) {
        return { ...cell, tile, rotation };
      }
      return cell;
    });
    setGrid(newGrid);
    setShowTileSelector(false);
  };

  const placeTileInGrid = (cell: GridCell, tile: TileData, rotation = 0) => {
    const newGrid = grid.map(c => 
      c.x === cell.x && c.y === cell.y 
        ? { ...c, tile, rotation }
        : c
    );
    setGrid(newGrid);
  };

  const clearCell = (cell: GridCell) => {
    const newGrid = grid.map(c => 
      c.x === cell.x && c.y === cell.y 
        ? { ...c, tile: undefined, rotation: undefined }
        : c
    );
    setGrid(newGrid);
  };

  const fillGridWithAllTiles = () => {
    // Use the new fillGrid function from CoreFunctions
    const newGrid = fillGrid(grid, allTiles);
    setGrid(newGrid);
    
    // Clear duplicates since we're placing each tile only once
    setDuplicates(new Set());
  };

  // Rerender all tiles from scratch with 1-to-1 CSV mapping (no duplicates)
  const rerenderAllTiles = () => {
    if (allTiles.length === 0) {
      setTestMessage('❌ No tiles available to render');
      return;
    }
    
    console.log('🔄 Re-rendering all tiles from CSV (1-to-1 mapping)...');
    
    // Create new empty grid
    const newGrid: GridCell[] = [];
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 12; x++) {
        newGrid.push({ x, y });
      }
    }
    
    // Shuffle all available tiles for random placement
    const shuffledTiles = [...allTiles].sort(() => Math.random() - 0.5);
    
    // Fill grid with exactly 96 unique tiles (1-to-1 mapping)
    const tilesToPlace = Math.min(shuffledTiles.length, newGrid.length, 96);
    for (let i = 0; i < tilesToPlace; i++) {
      newGrid[i] = {
        ...newGrid[i],
        tile: shuffledTiles[i] // Each tile used exactly once
      };
    }
    
    setGrid(newGrid);
    clearHighlights();
    setDuplicates(new Set()); // Clear any duplicate tracking
    
    // Calculate and show the new score
    const score = calculateTotalScore(newGrid, 12);
    const maxPossible = 11 * 8 + 12 * 7; // horizontal + vertical edges
    const percentage = ((score / maxPossible) * 100).toFixed(1);
    
    console.log(`✅ Re-rendered ${tilesToPlace} unique tiles (1-to-1 CSV mapping)`);
    console.log(`📊 Random placement score: ${score}/${maxPossible} (${percentage}%)`);
    setTestMessage(`🔄 Re-rendered all ${tilesToPlace} unique tiles from CSV! Score: ${score}/${maxPossible} (${percentage}%)`);
  };

  // Run the Maximum Edge Matching optimization algorithm
  const runMaxEdgeMatching = async () => {
    if (isOptimizing) return;
    
    setIsOptimizing(true);
    setOptimizationProgress('Starting optimization...');
    clearHighlights();
    
    // Check if grid has tiles
    const hasTiles = grid.some(cell => cell.tile);
    const initialGrid = hasTiles ? grid : undefined;
    
    if (!hasTiles) {
      setOptimizationProgress('Initializing with random placement...');
    }
    
    // Run optimization with progress updates
    setTimeout(() => {
      const result = maximizeEdgeMatching(
        allTiles,
        initialGrid,
        12, // gridWidth
        8,  // gridHeight
        50, // maxIterations
        (progress) => {
          // Update progress message
          if (progress.phase === 'complete') {
            const maxPossible = 11 * 8 + 12 * 7; // horizontal + vertical edges
            const percentage = ((progress.score / maxPossible) * 100).toFixed(1);
            setOptimizationProgress(`✅ Complete! Score: ${progress.score}/${maxPossible} (${percentage}%)`);
            setTestMessage(`🎯 Optimization complete! Final score: ${progress.score}/${maxPossible} (${percentage}%) in ${progress.iteration} iterations`);
          } else {
            setOptimizationProgress(`Iteration ${progress.iteration}: ${progress.phase === 'swap' ? 'swapping tiles' : progress.phase} - Score: ${progress.score}`);
          }
        }
      );
      
      // Apply the optimized grid
      setGrid(result.grid);
      setIsOptimizing(false);
      
      // Show improvement summary
      const improvement = result.score - result.improvements[0];
      console.log(`📈 Total improvement: +${improvement} matches`);
      
      // Clear progress after a delay
      setTimeout(() => {
        setOptimizationProgress('');
      }, 5000);
    }, 100);
  };

  const runEdgeMatching = () => {
    if (isOptimizing) {
      setTestMessage('⚠️ Another optimization is already running. Please wait...');
      setTimeout(() => setTestMessage(''), 2000);
      return;
    }
    
    setIsOptimizing(true);
    try {
      // Run the optimize edge matching function
      const newGrid = optimizeEdgeMatching(grid);
      setGrid(newGrid);
      setTestMessage('✅ Edge matching optimization complete!');
      setTimeout(() => setTestMessage(''), 3000);
    } finally {
      setIsOptimizing(false);
    }
  };

  // NEW: Configurable optimization functions
  const runOptimizeWithPreset = (presetName: string) => {
    // Prevent multiple optimizations from running simultaneously
    if (isOptimizing) {
      setTestMessage('⚠️ Another optimization is already running. Please wait...');
      setTimeout(() => setTestMessage(''), 2000);
      return;
    }

    try {
      setIsOptimizing(true);
      console.log('🎯 Starting preset optimization:', presetName);
      console.log('optimizeWithPreset function:', optimizeWithPreset);
      console.log('OPTIMIZATION_PRESETS:', OPTIMIZATION_PRESETS);
      
      setTestMessage(`🎯 Optimizing with preset: ${presetName}...`);
      
      if (!optimizeWithPreset || typeof optimizeWithPreset !== 'function') {
        throw new Error('optimizeWithPreset function is not available');
      }
      
      const result = optimizeWithPreset(grid, allTiles, presetName as keyof typeof OPTIMIZATION_PRESETS);
      
      console.log('Optimization result:', result);
      
      setGrid(result.grid);
      setOptimizationResult(result);
      setTestMessage(`✅ ${presetName} optimization complete! ${result.swaps} swaps, ${result.executionTime.toFixed(1)}ms`);
      
      // Clear message after delay
      setTimeout(() => {
        setTestMessage('');
        setIsOptimizing(false);
      }, 4000);
    } catch (error) {
      console.error('Error in runOptimizeWithPreset:', error);
      setTestMessage(`❌ Error: ${error.message}`);
      setTimeout(() => {
        setTestMessage('');
        setIsOptimizing(false);
      }, 4000);
    }
  };

  const runOptimizeForColor = (color: 'a' | 'b' | 'c' | 'd') => {
    if (isOptimizing) {
      setTestMessage('⚠️ Another optimization is already running. Please wait...');
      setTimeout(() => setTestMessage(''), 2000);
      return;
    }
    
    setIsOptimizing(true);
    try {
      console.log('🎨 Starting color optimization:', color);
      console.log('optimizeForSingleColor function:', optimizeForSingleColor);
      
      setTestMessage(`🎨 Optimizing for color ${color.toUpperCase()}...`);
      
      if (!optimizeForSingleColor || typeof optimizeForSingleColor !== 'function') {
        throw new Error('optimizeForSingleColor function is not available');
      }
      
      const result = optimizeForSingleColor(grid, allTiles, color);
      
      console.log('Color optimization result:', result);
      
      setGrid(result.grid);
      setOptimizationResult(result);
      setTestMessage(`✅ Color ${color.toUpperCase()} optimization complete! ${result.swaps} swaps, ${result.executionTime.toFixed(1)}ms`);
      
      // Clear message after delay
      setTimeout(() => setTestMessage(''), 4000);
    } catch (error) {
      console.error('Error in runOptimizeForColor:', error);
      setTestMessage(`❌ Error: ${error.message}`);
      setTimeout(() => setTestMessage(''), 4000);
    } finally {
      setIsOptimizing(false);
    }
  };

  const runCustomOptimization = () => {
    if (isOptimizing) {
      setTestMessage('⚠️ Another optimization is already running. Please wait...');
      setTimeout(() => setTestMessage(''), 2000);
      return;
    }
    
    setIsOptimizing(true);
    try {
      console.log('⚡ Starting custom optimization');
      console.log('optimizeGridConfigurable function:', optimizeGridConfigurable);
      console.log('Custom weights:', customWeights);
      console.log('Selected traversal:', selectedTraversal);
      
      setTestMessage('⚡ Running custom optimization...');
      
      if (!optimizeGridConfigurable || typeof optimizeGridConfigurable !== 'function') {
        throw new Error('optimizeGridConfigurable function is not available');
      }
      
      const result = optimizeGridConfigurable(grid, allTiles, {
        weights: {
          edgeMatching: customWeights.edgeMatching,
          mirrorBonus: customWeights.mirrorBonus,
          rotationBonus: customWeights.rotationBonus,
          colorPriority: customWeights.colorPriority,
          shapeCluster: customWeights.shapeCluster,
          distancePenalty: customWeights.distancePenalty
        },
        traversal: selectedTraversal as any,
        debug: false
      });
      
      console.log('Custom optimization result:', result);
      
      setGrid(result.grid);
      setOptimizationResult(result);
      setTestMessage(`✅ Custom optimization complete! ${result.swaps} swaps, ${result.executionTime.toFixed(1)}ms`);
      
      // Clear message after delay
      setTimeout(() => setTestMessage(''), 4000);
    } catch (error) {
      console.error('Error in runCustomOptimization:', error);
      setTestMessage(`❌ Error: ${error.message}`);
      setTimeout(() => setTestMessage(''), 4000);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Update custom weights
  const updateCustomWeight = (key: string, value: number) => {
    setCustomWeights(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateColorPriority = (color: 'a' | 'b' | 'c' | 'd', value: number) => {
    setCustomWeights(prev => ({
      ...prev,
      colorPriority: {
        ...prev.colorPriority,
        [color]: value
      }
    }));
  };

  const runOptimizeMirrorPlacement = () => {
    if (isOptimizing) {
      setTestMessage('⚠️ Another optimization is already running. Please wait...');
      setTimeout(() => setTestMessage(''), 2000);
      return;
    }
    
    if (!tileRelationships) {
      setTestMessage('❌ Tile relationships not loaded yet');
      return;
    }
    
    setIsOptimizing(true);

    setTestMessage('🪞 Optimizing mirror placement...');
    
    // Score function that prioritizes mirror proximity and correct orientation
    const scoreFn = (grid: GridCell[]) => {
      const score = calculatePatternScore(grid, tileRelationships);
      return score.mirrorScore; // Uses enhanced scoring with orientation bonuses
    };
    
    const optimizedGrid = iterativeImprove(grid, scoreFn, 5);
    const mirrorPairs = findAllMirrorPairs(optimizedGrid, tileRelationships);
    
    // Count correctly oriented pairs
    const horizontalPairs = mirrorPairs.filter(p => p.direction === 'horizontal').length;
    const verticalPairs = mirrorPairs.filter(p => p.direction === 'vertical').length;
    
    setGrid(optimizedGrid);
    setTestMessage(`🪞 Optimized mirror placement! Found ${mirrorPairs.length} mirror pairs: ${horizontalPairs} horizontal, ${verticalPairs} vertical. Horizontal mirrors placed horizontally, vertical mirrors placed vertically.`);
    
    // Clear message after 7 seconds (longer message)
    setTimeout(() => setTestMessage(''), 7000);
    setIsOptimizing(false);
  };



  const runAnalyzePatternQuality = () => {
    if (!tileRelationships) {
      setPatternAnalysis('❌ Tile relationships not loaded yet');
      return;
    }

    const score = calculatePatternScore(grid, tileRelationships);
    const mirrorPairs = findAllMirrorPairs(grid, tileRelationships);
    
    const analysis = `Edge: ${(score.edgeScore * 100).toFixed(1)}% | Mirror: ${mirrorPairs.length} pairs | Color: ${(score.colorBalance * 100).toFixed(1)}% | Flow: ${score.flowScore} | Overall: ${(score.totalScore * 100).toFixed(1)}% ${score.totalScore > 0.7 ? '✅' : '🔧'}`;

    setPatternAnalysis(analysis);
  };

  // Test recursive functions - require a selected cell
  const testFindMirrorTile = (direction: 'horizontal' | 'vertical') => {
    console.log('🪞 testFindMirrorTile called with direction:', direction);
    
    if (!tileRelationships) {
      setTestMessage('❌ Tile relationships not loaded yet');
      return;
    }

    const selectedCell = Array.from(selectedCells).length === 1 
      ? getCellFromKey(Array.from(selectedCells)[0])
      : null;
    
    if (!selectedCell?.tile) {
      setTestMessage('❌ Please select exactly one cell with a tile first');
      return;
    }

    const mirrorTile = findMirrorTile(selectedCell.tile, direction, tileRelationships);
    if (mirrorTile) {
      // Highlight the mirror tile in the grid
      const mirrorPositions = findTilePositions([mirrorTile.id]);
      setHighlightedTiles(new Set(mirrorPositions));
      setHighlightType(`mirror-${direction}`);
      
      setTestMessage(`🪞 Found ${direction} mirror: ${selectedCell.tile.id} → ${mirrorTile.id} (highlighted in green)`);
      
      // Try to place mirror tile in adjacent position if not already placed
      if (mirrorPositions.length === 0) {
        const currentPos = selectedCell.y * 12 + selectedCell.x;
        let targetPos: number;
        
        if (direction === 'horizontal') {
          targetPos = selectedCell.x < 11 ? currentPos + 1 : currentPos - 1;
        } else {
          targetPos = selectedCell.y < 7 ? currentPos + 12 : currentPos - 12;
        }
        
        if (targetPos >= 0 && targetPos < 96 && !grid[targetPos].tile) {
          const newGrid = [...grid];
          newGrid[targetPos] = { ...newGrid[targetPos], tile: mirrorTile, rotation: 0 };
          setGrid(newGrid);
          
          // Update highlights to include the newly placed tile
          const targetCell = grid.find((_, index) => index === targetPos);
          if (targetCell) {
            setHighlightedTiles(new Set([getCellKey(targetCell)]));
            setTestMessage(prev => prev + ` ✅ Placed and highlighted`);
          }
        }
      }
    } else {
      clearHighlights();
      setTestMessage(`❌ No ${direction} mirror found for ${selectedCell.tile.id}`);
    }
  };

  const testFindRotationFamily = () => {
    if (!tileRelationships) {
      setTestMessage('❌ Tile relationships not loaded yet');
      return;
    }

    const selectedCell = Array.from(selectedCells).length === 1 
      ? getCellFromKey(Array.from(selectedCells)[0])
      : null;
    
    if (!selectedCell?.tile) {
      setTestMessage('❌ Please select exactly one cell with a tile first');
      return;
    }

    const rotationFamily = findRotationFamily(selectedCell.tile, tileRelationships);
    if (rotationFamily.length > 0) {
      // Highlight all rotation variants in the grid
      const rotationIds = rotationFamily.map(t => t.id);
      const rotationPositions = findTilePositions(rotationIds);
      setHighlightedTiles(new Set(rotationPositions));
      setHighlightType('rotation');
      
      setTestMessage(`🔄 Found ${rotationFamily.length} rotations of tile "${selectedCell.tile.id}" (highlighted in blue): ${rotationFamily.map(t => t.id).join(', ')}`);
    } else {
      clearHighlights();
      setTestMessage(`❌ No rotation variants found for ${selectedCell.tile.id}`);
    }
  };

  const selectRotationGroup = () => {
    const selectedCell = Array.from(selectedCells).length === 1 
      ? getCellFromKey(Array.from(selectedCells)[0]) 
      : null;
      
    if (!selectedCell?.tile) {
      setTestMessage('❌ Please select exactly one cell with a tile first');
      return;
    }

    // Find all tiles with the same rotation value (0, 1, 2, or 3)
    const selectedRotation = selectedCell.tile.rotation;
    console.log('🔷 Selected tile rotation:', selectedRotation, 'Tile:', selectedCell.tile.id);
    const rotationGroup = allTiles.filter(tile => tile.rotation === selectedRotation);
    if (rotationGroup.length > 0) {
      // Highlight all tiles with the same rotation value in the grid
      const groupIds = rotationGroup.map(t => t.id);
      const groupPositions = findTilePositions(groupIds);
      setHighlightedTiles(new Set(groupPositions));
      setHighlightType('shape');
      
      const rotationNames: { [key: string]: string } = {
        '0': 'Base (0°)',
        '1': '90° CW',
        '2': '180°',
        '3': '270° CW'
      };
      const rotationName = rotationNames[String(selectedRotation)] || `Rotation ${selectedRotation}`;
      
      setTestMessage(`🔷 Found ${rotationGroup.length} tiles with ${rotationName} rotation (highlighted in purple)`);
    } else {
      clearHighlights();
      setTestMessage(`❌ No tiles found with the same rotation`);
    }
  };

  // Helper function to convert grid to CSV data format for analysis
  const getCurrentGridAsCSVData = () => {
    const csvData: any[] = [];
    grid.forEach((cell) => {
      if (cell.tile) {
        const cellKey = `${cell.x}-${cell.y}`;
        const isHighlighted = highlightedTiles.has(cellKey);
        
        // Calculate edge matches
        let northMatch = 0, eastMatch = 0, southMatch = 0, westMatch = 0;
        
        // Check North neighbor
        if (cell.y > 0) {
          const northIndex = (cell.y - 1) * 12 + cell.x;
          const northCell = grid[northIndex];
          if (northCell?.tile && northCell.tile.edgeS === cell.tile.edgeN) {
            northMatch = 1;
          }
        }
        
        // Check East neighbor
        if (cell.x < 11) {
          const eastIndex = cell.y * 12 + (cell.x + 1);
          const eastCell = grid[eastIndex];
          if (eastCell?.tile && eastCell.tile.edgeW === cell.tile.edgeE) {
            eastMatch = 1;
          }
        }
        
        // Check South neighbor
        if (cell.y < 7) {
          const southIndex = (cell.y + 1) * 12 + cell.x;
          const southCell = grid[southIndex];
          if (southCell?.tile && southCell.tile.edgeN === cell.tile.edgeS) {
            southMatch = 1;
          }
        }
        
        // Check West neighbor
        if (cell.x > 0) {
          const westIndex = cell.y * 12 + (cell.x - 1);
          const westCell = grid[westIndex];
          if (westCell?.tile && westCell.tile.edgeE === cell.tile.edgeW) {
            westMatch = 1;
          }
        }
        
        const neighborScore = northMatch + eastMatch + southMatch + westMatch;
        
        // Calculate mirror positions
        let mirrorH_position = '';
        let mirrorV_position = '';
        
        // Check for horizontal mirror in adjacent positions
        if (cell.tile.mirrorH) {
          // Check North
          if (cell.y > 0) {
            const northCell = grid[(cell.y - 1) * 12 + cell.x];
            if (northCell?.tile?.id === cell.tile.mirrorH) mirrorH_position = 'north';
          }
          // Check South
          if (cell.y < 7) {
            const southCell = grid[(cell.y + 1) * 12 + cell.x];
            if (southCell?.tile?.id === cell.tile.mirrorH) mirrorH_position = 'south';
          }
        }
        
        // Check for vertical mirror in adjacent positions
        if (cell.tile.mirrorV) {
          // Check East
          if (cell.x < 11) {
            const eastCell = grid[cell.y * 12 + (cell.x + 1)];
            if (eastCell?.tile?.id === cell.tile.mirrorV) mirrorV_position = 'east';
          }
          // Check West
          if (cell.x > 0) {
            const westCell = grid[cell.y * 12 + (cell.x - 1)];
            if (westCell?.tile?.id === cell.tile.mirrorV) mirrorV_position = 'west';
          }
        }
        
        csvData.push({
          row: cell.y + 1,
          col: cell.x + 1,
          tileId: cell.tile.id,
          northEdge: cell.tile.edgeN,
          eastEdge: cell.tile.edgeE,
          southEdge: cell.tile.edgeS,
          westEdge: cell.tile.edgeW,
          rotation: cell.rotation || 0,
          isHighlighted,
          highlightType: isHighlighted ? highlightType : '',
          shapeFamily: cell.tile.shape,
          northMatch,
          eastMatch,
          southMatch,
          westMatch,
          neighborScore,
          mirrorH_position,
          mirrorV_position
        });
      }
    });
    return csvData;
  };

  // CSV Export/Import Functions
  const handleExportGrid = () => {
    const result = exportGridToCSV(grid, highlightedTiles, highlightType);
    
    if (result.success && result.csvData) {
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `grid-export-${timestamp}.csv`;
      
      downloadCSV(result.csvData, filename);
      
      
      setTestMessage(`✅ Grid exported successfully! ${result.message}`);
      
      // Clear message after 5 seconds
      setTimeout(() => setTestMessage(''), 5000);
    } else {
      setTestMessage(`❌ Export failed: ${result.message}`);
      setTimeout(() => setTestMessage(''), 5000);
    }
  };

  const handleImportGrid = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = await validateCSVFile(file);
    if (!validation.valid) {
      setTestMessage(`❌ ${validation.message}`);
      setTimeout(() => setTestMessage(''), 5000);
      return;
    }

    if (!validation.data) return;

    // Import grid
    const result = importGridFromCSV(validation.data, allTiles);
    
    if (result.success && result.grid) {
      setGrid(result.grid);
      
      // Restore highlighting if present
      if (result.highlightedCells && result.highlightedCells.size > 0) {
        setHighlightedTiles(result.highlightedCells);
        setHighlightType(result.highlightType || '');
      } else {
        clearHighlights();
      }
      
      setTestMessage(`✅ Grid imported successfully! ${result.message}`);
      
      // Clear message after 7 seconds (longer for import results)
      setTimeout(() => setTestMessage(''), 7000);
    } else {
      setTestMessage(`❌ Import failed: ${result.message}`);
      setTimeout(() => setTestMessage(''), 5000);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  const testFindEdgeMatches = (direction: 'north' | 'south' | 'east' | 'west') => {
    console.log('🔗 testFindEdgeMatches called with direction:', direction);
    
    if (!tileRelationships) {
      setTestMessage('❌ Tile relationships not loaded yet');
      return;
    }

    const selectedCell = Array.from(selectedCells).length === 1 
      ? getCellFromKey(Array.from(selectedCells)[0])
      : null;
    
    if (!selectedCell?.tile) {
      setTestMessage('❌ Please select exactly one cell with a tile first');
      return;
    }

    const edgeMatches = findEdgeMatches(selectedCell.tile, direction, tileRelationships);
    if (edgeMatches.length > 0) {
      // Highlight all edge matches in the grid
      const edgeIds = edgeMatches.map(t => t.id);
      const edgePositions = findTilePositions(edgeIds);
      console.log('🎯 Setting highlights:', edgePositions, 'type:', `edge-${direction}`);
      setHighlightedTiles(new Set(edgePositions));
      setHighlightType(`edge-${direction}`);
      
      const displayMatches = edgeMatches.slice(0, 5).map(t => t.id).join(', ');
      const moreText = edgeMatches.length > 5 ? `... (${edgeMatches.length - 5} more)` : '';
      setTestMessage(`🔗 Found ${edgeMatches.length} edge matches for ${direction} (highlighted in orange): ${displayMatches}${moreText}`);
    } else {
      clearHighlights();
      setTestMessage(`❌ No edge matches found for ${selectedCell.tile.id} in ${direction} direction`);
    }
  };


  // Detect duplicate tiles
  const detectDuplicates = useCallback(() => {
    const tileCount = new Map<string, number>();
    const duplicateIds = new Set<string>();
    
    grid.forEach(cell => {
      if (cell.tile) {
        const count = (tileCount.get(cell.tile.id) || 0) + 1;
        tileCount.set(cell.tile.id, count);
        if (count > 1) {
          duplicateIds.add(cell.tile.id);
        }
      }
    });
    
    setDuplicates(duplicateIds);
    return duplicateIds;
  }, [grid]);

  // Get available (unused) tiles
  const getAvailableTiles = useCallback(() => {
    const usedTileIds = new Set(grid.filter(c => c.tile).map(c => c.tile!.id));
    return allTiles.filter(tile => !usedTileIds.has(tile.id));
  }, [grid, allTiles]);

  // Auto-correct duplicates by replacing with available tiles
  const autoCorrectDuplicates = () => {
    const availableTiles = getAvailableTiles();
    const duplicateIds = detectDuplicates();
    
    if (duplicateIds.size === 0 || availableTiles.length === 0) return;
    
    let availableIndex = 0;
    const seenIds = new Set<string>();
    
    const newGrid = grid.map(cell => {
      if (cell.tile && duplicateIds.has(cell.tile.id)) {
        // Keep the first occurrence, replace subsequent ones
        if (seenIds.has(cell.tile.id) && availableIndex < availableTiles.length) {
          return { ...cell, tile: availableTiles[availableIndex++], rotation: 0 };
        }
        seenIds.add(cell.tile.id);
      }
      return cell;
    });
    setGrid(newGrid);
    
    // Re-detect duplicates after correction
    setTimeout(() => detectDuplicates(), 100);
  };

  // Update duplicate detection when grid changes
  useEffect(() => {
    detectDuplicates();
  }, [grid]);

  // Drag and Drop handlers for group dragging
  const handleDragStart = (e: React.DragEvent, cell: GridCell) => {
    const cellKey = getCellKey(cell);
    
    // If the dragged cell is part of selection, drag all selected tiles
    if (selectedCells.has(cellKey)) {
      const tilesToDrag = new Map<string, { tile: TileData, rotation: number }>();
      const cellsToClear = new Set<string>();
      
      selectedCells.forEach(key => {
        const selectedCell = getCellFromKey(key);
        if (selectedCell?.tile) {
          tilesToDrag.set(key, { 
            tile: selectedCell.tile, 
            rotation: selectedCell.rotation || 0 
          });
          cellsToClear.add(key);
        }
      });
      
      if (tilesToDrag.size > 0) {
        setIsDragging(true);
        setDraggedTiles(tilesToDrag);
        setDraggedFromCells(cellsToClear);
        
        // Create custom drag image showing count
        const dragImage = document.createElement('div');
        dragImage.style.width = '60px';
        dragImage.style.height = '60px';
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-1000px';
        dragImage.innerHTML = `<div style="background: #3B82F6; color: white; padding: 4px 8px; border-radius: 4px;">${tilesToDrag.size} tiles</div>`;
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 30, 30);
        
        e.dataTransfer.effectAllowed = 'move';
      }
    } else if (cell.tile) {
      // Single tile drag
      setIsDragging(true);
      const tilesToDrag = new Map<string, { tile: TileData, rotation: number }>();
      tilesToDrag.set(cellKey, { tile: cell.tile, rotation: cell.rotation || 0 });
      setDraggedTiles(tilesToDrag);
      setDraggedFromCells(new Set([cellKey]));
      
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedTiles(new Map());
    setDraggedFromCells(new Set());
    setDropTargetCell(null);
  };

  const handleDragOver = (e: React.DragEvent, cell: GridCell) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetCell(cell);
  };

  const handleDragLeave = () => {
    setDropTargetCell(null);
  };

  const handleDrop = (e: React.DragEvent, targetCell: GridCell) => {
    e.preventDefault();
    
    if (draggedTiles.size === 0) return;
    
    // Calculate offset for group movement
    const firstDraggedKey = Array.from(draggedFromCells)[0];
    const firstDraggedCell = getCellFromKey(firstDraggedKey);
    if (!firstDraggedCell) return;
    
    const offsetX = targetCell.x - firstDraggedCell.x;
    const offsetY = targetCell.y - firstDraggedCell.y;
    
    // Create new grid state
    const newGrid = [...grid];
    const tilesToPlace = new Map<string, { tile: TileData, rotation: number }>();
    
    // Clear original positions
    draggedFromCells.forEach(key => {
      const cell = getCellFromKey(key);
      if (cell) {
        const index = cell.y * 12 + cell.x;
        newGrid[index] = { ...newGrid[index], tile: undefined, rotation: undefined };
      }
    });
    
    // Calculate new positions for dragged tiles
    draggedFromCells.forEach(key => {
      const [x, y] = key.split('-').map(Number);
      const newX = x + offsetX;
      const newY = y + offsetY;
      
      // Check if new position is within bounds
      if (newX >= 0 && newX < 12 && newY >= 0 && newY < 8) {
        const newKey = `${newX}-${newY}`;
        const tileData = draggedTiles.get(key);
        if (tileData) {
          tilesToPlace.set(newKey, tileData);
        }
      }
    });
    
    // Place tiles in new positions
    tilesToPlace.forEach((tileData, key) => {
      const [x, y] = key.split('-').map(Number);
      const index = y * 12 + x;
      newGrid[index] = { 
        ...newGrid[index], 
        tile: tileData.tile, 
        rotation: tileData.rotation 
      };
    });
    
    setGrid(newGrid);
    handleDragEnd();
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Main Grid (12×8 - 96 tiles)</h2>
          <div className="flex gap-4 items-center">
            <div className="text-sm text-gray-400">
              Selected: {selectedCells.size} cells
            </div>
            {duplicates.size > 0 && (
              <div className="text-sm text-yellow-400">
                ⚠ {duplicates.size} duplicate{duplicates.size > 1 ? 's' : ''}
              </div>
            )}
            <button 
              onClick={() => setShowDuplicates(!showDuplicates)}
              className={`px-3 py-1 text-white rounded text-sm transition-colors ${
                showDuplicates ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {showDuplicates ? 'Hide' : 'Show'} Duplicates
            </button>
            {duplicates.size > 0 && (
              <button 
                onClick={autoCorrectDuplicates}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
              >
                Auto-Fix
              </button>
            )}
          </div>
        </div>

        {/* Instructions - moved after title */}
        <div className="mb-4 p-3 bg-gray-700 rounded text-gray-300 text-sm">
          <p>• Click to select | Shift+Click for range | Ctrl+Click for multi-select</p>
          <p>• Arrow keys to navigate | Delete to remove | Drag tiles to reorder</p>
          <p>• Ctrl+A to select all | Escape to clear selection</p>
        </div>
        
        {/* Pattern Function Buttons - Top of Grid */}
        <div className="flex flex-wrap gap-3 mb-4">
          <button 
            onClick={fillGridWithAllTiles}
            className="flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-lg
                     hover:bg-purple-600 transition-all duration-200 font-semibold
                     hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>📦</span>
            Fill All Tiles
          </button>
          <button 
            onClick={rerenderAllTiles}
            className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg
                     hover:bg-blue-600 transition-all duration-200 font-semibold
                     hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>🔄</span>
            Rerender All Tiles
          </button>
          <button 
            onClick={runMaxEdgeMatching}
            disabled={isOptimizing}
            className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg
                     transition-all duration-200 font-semibold
                     hover:scale-[1.02] active:scale-[0.98]
                     ${isOptimizing 
                       ? 'bg-gray-600 cursor-not-allowed' 
                       : 'bg-red-700 hover:bg-red-600'}`}
          >
            <span>{isOptimizing ? '⏳' : '🎯'}</span>
            {isOptimizing ? 'Optimizing...' : 'Max Edge Matching'}
          </button>
          <button 
            onClick={runEdgeMatching}
            disabled={isOptimizing}
            className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg
                     transition-all duration-200 font-semibold
                     hover:scale-[1.02] active:scale-[0.98]
                     ${isOptimizing 
                       ? 'bg-gray-600 cursor-not-allowed' 
                       : 'bg-purple-700 hover:bg-purple-600'}`}
          >
            <span>{isOptimizing ? '⏳' : '🎨'}</span>
            {isOptimizing ? 'Optimizing...' : 'Optimize Edge Matching'}
          </button>
          <button 
            onClick={runOptimizeMirrorPlacement}
            disabled={isOptimizing}
            className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg
                     transition-all duration-200 font-semibold
                     hover:scale-[1.02] active:scale-[0.98]
                     ${isOptimizing 
                       ? 'bg-gray-600 cursor-not-allowed' 
                       : 'bg-emerald-700 hover:bg-emerald-600'}`}
          >
            <span>{isOptimizing ? '⏳' : '🪞'}</span>
            {isOptimizing ? 'Optimizing...' : 'Optimize Mirrors'}
          </button>
        </div>

        {/* NEW: Configurable Optimization Controls */}
        <div className="bg-gray-700 rounded-lg p-4 mb-4">
          <h3 className="text-white font-semibold mb-3">⚡ New Configurable Optimization</h3>
          
          {/* Preset Selection Row */}
          <div className="flex flex-wrap gap-3 mb-3">
            <select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              className="px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
            >
              <option value="classic">Classic (Current Default)</option>
              <option value="edgeFocused">Edge Focused</option>
              <option value="mirrorHeavy">Mirror Heavy</option>
              <option value="shapeClustered">Shape Clustered</option>
              <option value="colorFocusedA">Color A Priority</option>
              <option value="spiral">Spiral Pattern</option>
              <option value="multiPass">Multi-Pass</option>
            </select>
            
            <button 
              onClick={() => runOptimizeWithPreset(selectedPreset)}
              disabled={isOptimizing}
              className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg
                       transition-all duration-200 font-semibold
                       hover:scale-[1.02] active:scale-[0.98]
                       ${isOptimizing 
                         ? 'bg-gray-600 cursor-not-allowed' 
                         : 'bg-indigo-700 hover:bg-indigo-600'}`}
            >
              <span>{isOptimizing ? '⏳' : '🎯'}</span>
              {isOptimizing ? 'Optimizing...' : 'Run Preset'}
            </button>

            <button 
              onClick={() => setShowCustomWeights(!showCustomWeights)}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-700 text-white rounded-lg
                       hover:bg-yellow-600 transition-all duration-200 font-semibold
                       hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>{showCustomWeights ? '📊' : '⚙️'}</span>
              {showCustomWeights ? 'Hide Custom' : 'Custom Weights'}
            </button>

            {showCustomWeights && (
              <button 
                onClick={runCustomOptimization}
                disabled={isOptimizing}
                className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg
                         transition-all duration-200 font-semibold
                         hover:scale-[1.02] active:scale-[0.98]
                         ${isOptimizing 
                           ? 'bg-gray-600 cursor-not-allowed' 
                           : 'bg-green-700 hover:bg-green-600'}`}
              >
                <span>{isOptimizing ? '⏳' : '⚡'}</span>
                {isOptimizing ? 'Optimizing...' : 'Run Custom'}
              </button>
            )}
          </div>

          {/* Single Color Optimization Row */}
          <div className="flex flex-wrap gap-3">
            <span className="text-gray-300 text-sm py-2">Single Color Optimization:</span>
            <button 
              onClick={() => runOptimizeForColor('a')}
              disabled={isOptimizing}
              className={`flex items-center gap-2 px-3 py-2 text-white rounded-lg
                       transition-all duration-200 font-semibold
                       hover:scale-[1.02] active:scale-[0.98]
                       ${isOptimizing 
                         ? 'bg-gray-600 cursor-not-allowed' 
                         : 'bg-pink-700 hover:bg-pink-600'}`}
            >
              <span>{isOptimizing ? '⏳' : '🅰️'}</span>
              {isOptimizing ? 'Optimizing...' : 'Color A'}
            </button>
            <button 
              onClick={() => runOptimizeForColor('b')}
              disabled={isOptimizing}
              className={`flex items-center gap-2 px-3 py-2 text-white rounded-lg
                       transition-all duration-200 font-semibold
                       hover:scale-[1.02] active:scale-[0.98]
                       ${isOptimizing 
                         ? 'bg-gray-600 cursor-not-allowed' 
                         : 'bg-blue-700 hover:bg-blue-600'}`}
            >
              <span>{isOptimizing ? '⏳' : '🅱️'}</span>
              {isOptimizing ? 'Optimizing...' : 'Color B'}
            </button>
            <button 
              onClick={() => runOptimizeForColor('c')}
              disabled={isOptimizing}
              className={`flex items-center gap-2 px-3 py-2 text-white rounded-lg
                       transition-all duration-200 font-semibold
                       hover:scale-[1.02] active:scale-[0.98]
                       ${isOptimizing 
                         ? 'bg-gray-600 cursor-not-allowed' 
                         : 'bg-orange-700 hover:bg-orange-600'}`}
            >
              <span>{isOptimizing ? '⏳' : '🅲'}</span>
              {isOptimizing ? 'Optimizing...' : 'Color C'}
            </button>
            <button 
              onClick={() => runOptimizeForColor('d')}
              disabled={isOptimizing}
              className={`flex items-center gap-2 px-3 py-2 text-white rounded-lg
                       transition-all duration-200 font-semibold
                       hover:scale-[1.02] active:scale-[0.98]
                       ${isOptimizing 
                         ? 'bg-gray-600 cursor-not-allowed' 
                         : 'bg-green-700 hover:bg-green-600'}`}
            >
              <span>{isOptimizing ? '⏳' : '🅳'}</span>
              {isOptimizing ? 'Optimizing...' : 'Color D'}
            </button>
          </div>

          {/* Custom Weight Controls */}
          {showCustomWeights && (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg">
              <h4 className="text-white font-semibold mb-3">🎛️ Custom Weight Configuration</h4>
              
              {/* Traversal Pattern Selection */}
              <div className="mb-4">
                <label className="text-gray-300 text-sm block mb-2">Traversal Pattern:</label>
                <select
                  value={selectedTraversal}
                  onChange={(e) => setSelectedTraversal(e.target.value)}
                  className="px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
                >
                  <option value="row-major">Row Major (Default)</option>
                  <option value="column-major">Column Major</option>
                  <option value="spiral-clockwise">Spiral Clockwise</option>
                  <option value="spiral-counter">Spiral Counter</option>
                  <option value="diagonal">Diagonal Sweeps</option>
                  <option value="block-2x2">2x2 Blocks</option>
                  <option value="checkerboard">Checkerboard</option>
                  <option value="random-walk">Random Walk</option>
                </select>
              </div>

              {/* Weight Sliders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Edge Matching Weight */}
                <div>
                  <label className="text-gray-300 text-sm block mb-2">
                    Edge Matching: <span className="text-white font-semibold">{customWeights.edgeMatching}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="5"
                    value={customWeights.edgeMatching}
                    onChange={(e) => updateCustomWeight('edgeMatching', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0</span><span>200</span>
                  </div>
                </div>

                {/* Mirror Bonus Weight */}
                <div>
                  <label className="text-gray-300 text-sm block mb-2">
                    Mirror Bonus: <span className="text-white font-semibold">{customWeights.mirrorBonus}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="10"
                    value={customWeights.mirrorBonus}
                    onChange={(e) => updateCustomWeight('mirrorBonus', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0</span><span>500</span>
                  </div>
                </div>

                {/* Rotation Bonus Weight */}
                <div>
                  <label className="text-gray-300 text-sm block mb-2">
                    Rotation Bonus: <span className="text-white font-semibold">{customWeights.rotationBonus}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="5"
                    value={customWeights.rotationBonus}
                    onChange={(e) => updateCustomWeight('rotationBonus', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0</span><span>200</span>
                  </div>
                </div>

                {/* Shape Cluster Weight */}
                <div>
                  <label className="text-gray-300 text-sm block mb-2">
                    Shape Cluster: <span className="text-white font-semibold">{customWeights.shapeCluster}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="5"
                    value={customWeights.shapeCluster}
                    onChange={(e) => updateCustomWeight('shapeCluster', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0</span><span>200</span>
                  </div>
                </div>
              </div>

              {/* Color Priority Sliders */}
              <div className="mt-4">
                <h5 className="text-gray-300 text-sm font-semibold mb-2">Color Priority Weights:</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(['a', 'b', 'c', 'd'] as const).map(color => (
                    <div key={color}>
                      <label className="text-gray-300 text-sm block mb-2">
                        Color {color.toUpperCase()}: <span className="text-white font-semibold">{customWeights.colorPriority[color].toFixed(1)}</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.1"
                        value={customWeights.colorPriority[color]}
                        onChange={(e) => updateColorPriority(color, parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>0</span><span>10</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Distance Penalty */}
              <div className="mt-4">
                <label className="text-gray-300 text-sm block mb-2">
                  Distance Penalty: <span className="text-white font-semibold">{customWeights.distancePenalty}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={customWeights.distancePenalty}
                  onChange={(e) => updateCustomWeight('distancePenalty', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0</span><span>20</span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-gray-300 text-sm py-2">Quick Sets:</span>
                <button 
                  onClick={() => setCustomWeights({edgeMatching: 100, mirrorBonus: 10, rotationBonus: 5, colorPriority: {a: 1, b: 1, c: 1, d: 1}, shapeCluster: 5, distancePenalty: 1})}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Edge Focus
                </button>
                <button 
                  onClick={() => setCustomWeights({edgeMatching: 5, mirrorBonus: 300, rotationBonus: 50, colorPriority: {a: 1, b: 1, c: 1, d: 1}, shapeCluster: 10, distancePenalty: 2})}
                  className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                >
                  Mirror Focus
                </button>
                <button 
                  onClick={() => setCustomWeights({edgeMatching: 10, mirrorBonus: 20, rotationBonus: 10, colorPriority: {a: 1, b: 1, c: 1, d: 1}, shapeCluster: 100, distancePenalty: 5})}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Shape Focus
                </button>
                <button 
                  onClick={() => setCustomWeights({edgeMatching: 10, mirrorBonus: 100, rotationBonus: 50, colorPriority: {a: 1, b: 1, c: 1, d: 1}, shapeCluster: 20, distancePenalty: 1})}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                  Reset Default
                </button>
              </div>
            </div>
          )}

          {/* Optimization Results Display */}
          {optimizationResult && (
            <div className="mt-3 p-3 bg-gray-800 rounded text-sm text-gray-300">
              <div className="flex flex-wrap gap-4">
                <span>⚡ {optimizationResult.swaps} swaps</span>
                <span>🕒 {optimizationResult.executionTime.toFixed(1)}ms</span>
                <span>🔄 {optimizationResult.iterations} iterations</span>
                <span>📊 Score: {optimizationResult.finalScore}</span>
                {optimizationResult.converged && <span>✅ Converged</span>}
              </div>
            </div>
          )}
        </div>

        {/* CSV Export/Import Buttons */}
        <div className="flex flex-wrap gap-3 mb-4">
          <button 
            onClick={handleExportGrid}
            className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg
                     hover:bg-green-600 transition-all duration-200 font-semibold
                     hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>📤</span>
            Export Grid to CSV
          </button>
          <button 
            onClick={handleImportGrid}
            className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg
                     hover:bg-blue-600 transition-all duration-200 font-semibold
                     hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>📥</span>
            Import Grid from CSV
          </button>
        </div>


        {/* Recursive Function Buttons - Require Selected Cell */}
        <div className="mb-4">
          <div className="text-sm text-gray-400 mb-2">
            Analyze Tiles (select a tile first):
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => testFindMirrorTile('horizontal')}
              className="flex items-center gap-2 px-3 py-2 bg-green-700 text-white rounded
                       hover:bg-green-600 transition-all duration-200 text-sm
                       hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>🪞</span>
              Mirror H
            </button>
            <button 
              onClick={() => testFindMirrorTile('vertical')}
              className="flex items-center gap-2 px-3 py-2 bg-green-700 text-white rounded
                       hover:bg-green-600 transition-all duration-200 text-sm
                       hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>🪞</span>
              Mirror V
            </button>
            <button 
              onClick={testFindRotationFamily}
              className="flex items-center gap-2 px-3 py-2 bg-blue-700 text-white rounded
                       hover:bg-blue-600 transition-all duration-200 text-sm
                       hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>🔄</span>
              Same Shape
            </button>
            <button 
              onClick={selectRotationGroup}
              className="flex items-center gap-2 px-3 py-2 bg-purple-700 text-white rounded
                       hover:bg-purple-600 transition-all duration-200 text-sm
                       hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>🔷</span>
              Same Rotation
            </button>
            <button 
              onClick={() => testFindEdgeMatches('north')}
              className="flex items-center gap-2 px-3 py-2 bg-orange-700 text-white rounded
                       hover:bg-orange-600 transition-all duration-200 text-sm
                       hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>🔗</span>
              Edge ↑
            </button>
            <button 
              onClick={() => testFindEdgeMatches('south')}
              className="flex items-center gap-2 px-3 py-2 bg-orange-700 text-white rounded
                       hover:bg-orange-600 transition-all duration-200 text-sm
                       hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>🔗</span>
              Edge ↓
            </button>
            <button 
              onClick={() => testFindEdgeMatches('east')}
              className="flex items-center gap-2 px-3 py-2 bg-orange-700 text-white rounded
                       hover:bg-orange-600 transition-all duration-200 text-sm
                       hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>🔗</span>
              Edge →
            </button>
            <button 
              onClick={() => testFindEdgeMatches('west')}
              className="flex items-center gap-2 px-3 py-2 bg-orange-700 text-white rounded
                       hover:bg-orange-600 transition-all duration-200 text-sm
                       hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>🔗</span>
              Edge ←
            </button>
          </div>

          {/* Tile ID Toggle */}
          <div className="mt-3 flex items-center gap-3">
            <button 
              onClick={() => setShowTileIDs(!showTileIDs)}
              className={`flex items-center gap-2 px-3 py-2 rounded transition-all duration-200 text-sm font-semibold ${
                showTileIDs 
                  ? 'bg-yellow-600 text-white hover:bg-yellow-500' 
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              <span>{showTileIDs ? '🏷️' : '👁️'}</span>
              {showTileIDs ? 'Hide IDs' : 'Show Tile IDs'}
            </button>
            
            {/* Selected tile info */}
            {(() => {
              const selectedInfo = getSelectedTileInfo();
              return selectedInfo ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-900 rounded text-sm">
                  <span className="text-blue-300">Selected:</span>
                  <span className="font-mono text-white">{selectedInfo.id}</span>
                  <span className="text-blue-400 text-xs">({selectedInfo.position})</span>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">No tile selected</div>
              );
            })()}
          </div>
          
          {/* Optimization Progress Display */}
          {optimizationProgress && (
            <div className="mt-3 p-3 bg-blue-800 rounded text-sm text-white animate-pulse">
              {optimizationProgress}
            </div>
          )}
          
          {/* Test Message Display */}
          {testMessage && (
            <div className="mt-3 p-3 bg-gray-700 rounded text-sm text-white flex justify-between items-center">
              <span>{testMessage}</span>
              <div className="flex gap-2">
                <button 
                  onClick={clearHighlights}
                  className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
                  title="Clear highlights"
                >
                  Clear
                </button>
                <button 
                  onClick={() => setTestMessage('')}
                  className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
                  title="Close message"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid Display - Seamless tiles like artwork with row/column numbers */}
      <div className="flex mb-6" ref={gridRef}>
        {/* Row numbers */}
        <div className="flex flex-col">
          <div className="h-6 w-8"></div> {/* Empty corner */}
          {Array.from({length: 8}, (_, i) => (
            <div key={`row-${i}`} className="aspect-square w-8 flex items-center justify-center text-sm text-gray-400 font-mono">
              {i + 1}
            </div>
          ))}
        </div>
        
        <div className="flex flex-col">
          {/* Column letters */}
          <div className="flex h-6">
            {Array.from({length: 12}, (_, i) => (
              <div key={`col-${i}`} className="aspect-square w-full flex items-center justify-center text-sm text-gray-400 font-mono">
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          
          {/* Main Grid */}
          <div className="grid grid-cols-12 gap-0 border-2 border-gray-600">
            {grid.map((cell, index) => {
              const cellKey = getCellKey(cell);
              const isSelected = selectedCells.has(cellKey);
              const isFocused = focusedCell?.x === cell.x && focusedCell?.y === cell.y;
              const isDuplicate = showDuplicates && cell.tile && duplicates.has(cell.tile.id);
              const isHighlighted = highlightedTiles.has(cellKey);
              
              // Debug log for highlighting
              if (isHighlighted) {
                console.log('🎨 Applying highlight to cell:', cellKey, 'type:', highlightType);
              }
              
              return (
                <div
                  key={cellKey}
                  onClick={(e) => handleCellClick(cell, e.shiftKey, e.ctrlKey || e.metaKey)}
                  onContextMenu={(e) => handleCellRightClick(e, cell)}
                  onDragStart={(e) => handleDragStart(e, cell)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, cell)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, cell)}
                  draggable={!!cell.tile || selectedCells.has(cellKey)}
                  className={`
                    aspect-square cursor-pointer transition-all duration-200 relative
                    ${cell.tile ? '' : 'bg-gray-900 border border-gray-700'}
                    ${isDragging && draggedFromCells.has(cellKey) ? 'opacity-30' : ''}
                    ${dropTargetCell?.x === cell.x && dropTargetCell?.y === cell.y ? 'ring-4 ring-green-400 ring-inset' : ''}
                    ${isHighlighted ? getHighlightStyle(highlightType) : ''}
                    ${!isSelected && !isFocused && !isDuplicate && !isHighlighted ? 'hover:ring-2 hover:ring-gray-400 hover:ring-inset hover:z-10' : ''}
                  `}
                  tabIndex={0}
                >
                  {cell.tile && (
                    <TileRenderer
                      tile={cell.tile}
                      customColors={customColors}
                      seamless={true}
                    />
                  )}
                  
                  {/* Show tile ID when highlighted and toggle is on */}
                  {showTileIDs && isHighlighted && cell.tile && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-black bg-opacity-90 text-white text-xs px-2 py-1 rounded font-mono border border-white shadow-lg">
                        {cell.tile.id}
                      </div>
                    </div>
                  )}
                  
                  {/* Show selected tile ID when toggle is on */}
                  {showTileIDs && isSelected && cell.tile && !isHighlighted && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-blue-600 bg-opacity-90 text-white text-xs px-2 py-1 rounded font-mono border border-blue-300 shadow-lg">
                        {cell.tile.id}
                      </div>
                    </div>
                  )}
                  {!cell.tile && (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                      {String.fromCharCode(65 + cell.x)}{cell.y + 1}
                    </div>
                  )}
                  
                  {/* Selection Overlays */}
                  {isSelected && (
                    <div className="absolute inset-0 pointer-events-none z-10">
                      <div className="absolute inset-0 bg-blue-400 opacity-30 animate-pulse"></div>
                      <div className="absolute inset-0 ring-4 ring-blue-500 ring-inset"></div>
                      {selectedCells.size > 1 && (
                        <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs px-1 rounded-bl">
                          ✓
                        </div>
                      )}
                    </div>
                  )}
                  {isFocused && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-0 ring-4 ring-yellow-400 ring-inset"></div>
                    </div>
                  )}
                  {isDuplicate && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-0 bg-red-500 opacity-20"></div>
                      <div className="absolute inset-0 ring-2 ring-red-500 ring-inset"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Cells Info */}
      {selectedCells.size > 0 && (
        <div className="bg-gray-700 rounded-lg p-4 mb-4">
          <h3 className="text-white font-bold mb-2">
            Selected: {selectedCells.size} cell{selectedCells.size > 1 ? 's' : ''}
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowTileSelector(true)}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Place Tiles
            </button>
            <button 
              onClick={handleDeleteSelected}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Grid Stats */}
      <div className="text-sm text-gray-400 flex gap-6 items-center">
        <span>Total cells: {grid.length}</span>
        <span>Filled: {grid.filter(c => c.tile).length}</span>
        <span>Empty: {grid.filter(c => !c.tile).length}</span>
        <span>Available tiles: {getAvailableTiles().length}</span>
        {duplicates.size > 0 && (
          <span className="text-yellow-400">Duplicates: {duplicates.size}</span>
        )}
        <button 
          onClick={runAnalyzePatternQuality}
          className="ml-4 px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 transition-colors"
        >
          📊 Analyze
        </button>
        {patternAnalysis && (
          <span className="ml-2 text-gray-300">{patternAnalysis}</span>
        )}
      </div>

      {/* Hidden file input for CSV import */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          tile={contextMenu.tile}
          gridX={contextMenu.gridX}
          gridY={contextMenu.gridY}
          onRenderInMiniPlayground={onRenderInMiniPlayground}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Tile Selector Modal */}
      {showTileSelector && (
        <TileSelector
          allTiles={allTiles}
          customColors={customColors}
          onTileSelect={handleTileSelect}
          onClose={() => setShowTileSelector(false)}
        />
      )}
    </div>
  );
}