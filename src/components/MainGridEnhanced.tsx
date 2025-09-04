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
  iterativeImprove
} from './CoreFunctions';

interface MainGridEnhancedProps {
  allTiles: TileData[];
  customColors: ColorScheme;
  grid?: GridCell[];
  onGridUpdate?: (newGrid: GridCell[]) => void;
  selectedTileFromTable?: TileData;
}

interface GridCell {
  x: number;
  y: number;
  tile?: TileData;
  rotation?: number;
}

export default function MainGridEnhanced({ allTiles, customColors, grid: externalGrid, onGridUpdate, selectedTileFromTable }: MainGridEnhancedProps) {
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
  const gridRef = useRef<HTMLDivElement>(null);

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
    setGrid(prev => prev.map(cell => {
      if (selectedCells.has(getCellKey(cell))) {
        return { ...cell, tile: undefined, rotation: undefined };
      }
      return cell;
    }));
    setSelectedCells(new Set());
  };

  const handleTileSelect = (tile: TileData, rotation: number) => {
    // Place tile in all selected cells
    setGrid(prev => prev.map(cell => {
      if (selectedCells.has(getCellKey(cell))) {
        return { ...cell, tile, rotation };
      }
      return cell;
    }));
    setShowTileSelector(false);
  };

  const placeTileInGrid = (cell: GridCell, tile: TileData, rotation = 0) => {
    setGrid(prev => prev.map(c => 
      c.x === cell.x && c.y === cell.y 
        ? { ...c, tile, rotation }
        : c
    ));
  };

  const clearCell = (cell: GridCell) => {
    setGrid(prev => prev.map(c => 
      c.x === cell.x && c.y === cell.y 
        ? { ...c, tile: undefined, rotation: undefined }
        : c
    ));
  };

  const fillGridWithAllTiles = () => {
    // Use the new fillGrid function from CoreFunctions
    const newGrid = fillGrid(grid, allTiles);
    setGrid(newGrid);
    
    // Clear duplicates since we're placing each tile only once
    setDuplicates(new Set());
  };

  const runEdgeMatching = () => {
    // Run the optimize edge matching function
    const newGrid = optimizeEdgeMatching(grid);
    setGrid(newGrid);
  };

  const runOptimizeMirrorPlacement = () => {
    if (!tileRelationships) {
      setTestMessage('❌ Tile relationships not loaded yet');
      return;
    }

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
  };

  const runBalanceColorDistribution = () => {
    if (!tileRelationships) {
      setTestMessage('❌ Tile relationships not loaded yet');
      return;
    }

    setTestMessage('🎨 Balancing color distribution...');
    
    // Score function that prioritizes color balance
    const scoreFn = (grid: GridCell[]) => {
      const score = calculatePatternScore(grid, tileRelationships);
      return score.colorBalance;
    };
    
    const optimizedGrid = iterativeImprove(grid, scoreFn, 8);
    const finalScore = calculatePatternScore(optimizedGrid, tileRelationships);
    
    setGrid(optimizedGrid);
    setTestMessage(`🎨 Balanced color distribution! Color balance score: ${(finalScore.colorBalance * 100).toFixed(1)}%`);
    
    // Clear message after 5 seconds
    setTimeout(() => setTestMessage(''), 5000);
  };

  const runAnalyzePatternQuality = () => {
    if (!tileRelationships) {
      setTestMessage('❌ Tile relationships not loaded yet');
      return;
    }

    const score = calculatePatternScore(grid, tileRelationships);
    const mirrorPairs = findAllMirrorPairs(grid, tileRelationships);
    
    const analysis = `📊 Pattern Analysis:
• Edge Matching: ${(score.edgeScore * 100).toFixed(1)}%
• Mirror Proximity: ${score.mirrorScore} points (${mirrorPairs.length} pairs)
• Color Balance: ${(score.colorBalance * 100).toFixed(1)}%
• Flow Continuity: ${score.flowScore} connections
• Overall Score: ${(score.totalScore * 100).toFixed(1)}%

${score.totalScore > 0.7 ? '✅ Pattern looks great!' : '🔧 Pattern could be improved'}`;

    setTestMessage(analysis);
    
    // Clear message after 10 seconds (longer for analysis)
    setTimeout(() => setTestMessage(''), 10000);
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
      
      setTestMessage(`🔄 Found ${rotationFamily.length} rotation variants for shape "${selectedCell.tile.shape}" (highlighted in blue): ${rotationFamily.map(t => t.id).join(', ')}`);
    } else {
      clearHighlights();
      setTestMessage(`❌ No rotation variants found for ${selectedCell.tile.id}`);
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
    
    setGrid(prev => prev.map(cell => {
      if (cell.tile && duplicateIds.has(cell.tile.id)) {
        // Keep the first occurrence, replace subsequent ones
        if (seenIds.has(cell.tile.id) && availableIndex < availableTiles.length) {
          return { ...cell, tile: availableTiles[availableIndex++], rotation: 0 };
        }
        seenIds.add(cell.tile.id);
      }
      return cell;
    }));
    
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
            onClick={runEdgeMatching}
            className="flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-lg
                     hover:bg-purple-600 transition-all duration-200 font-semibold
                     hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>🎨</span>
            Optimize Edge Matching
          </button>
          <button 
            onClick={runOptimizeMirrorPlacement}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg
                     hover:bg-emerald-600 transition-all duration-200 font-semibold
                     hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>🪞</span>
            Optimize Mirrors
          </button>
          <button 
            onClick={runBalanceColorDistribution}
            className="flex items-center gap-2 px-4 py-2 bg-amber-700 text-white rounded-lg
                     hover:bg-amber-600 transition-all duration-200 font-semibold
                     hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>🎨</span>
            Balance Colors
          </button>
          <button 
            onClick={runAnalyzePatternQuality}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-700 text-white rounded-lg
                     hover:bg-indigo-600 transition-all duration-200 font-semibold
                     hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>📊</span>
            Analyze Pattern
          </button>
        </div>

        {/* Recursive Function Buttons - Require Selected Cell */}
        <div className="mb-4">
          <div className="text-sm text-gray-400 mb-2">
            🎯 Recursive Functions (select a tile first):
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
              Rotations
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

      {/* Instructions */}
      <div className="mb-4 p-3 bg-gray-700 rounded text-gray-300 text-sm">
        <p>• Click to select | Shift+Click for range | Ctrl+Click for multi-select</p>
        <p>• Arrow keys to navigate | Delete to remove | Drag tiles to reorder</p>
        <p>• Ctrl+A to select all | Escape to clear selection</p>
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
      <div className="text-sm text-gray-400 flex gap-6">
        <span>Total cells: {grid.length}</span>
        <span>Filled: {grid.filter(c => c.tile).length}</span>
        <span>Empty: {grid.filter(c => !c.tile).length}</span>
        <span>Available tiles: {getAvailableTiles().length}</span>
        {duplicates.size > 0 && (
          <span className="text-yellow-400">Duplicates: {duplicates.size}</span>
        )}
      </div>

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