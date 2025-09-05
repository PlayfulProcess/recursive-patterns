/**
 * CSV Export/Import Functions
 * Handle exporting and importing grid state with highlighting information
 */

import { GridCell } from './types';
import { TileData } from '../../components/CSVTable';

export interface GridExportData {
  row: number;
  col: number;
  tileId: string;
  northEdge: string;
  eastEdge: string;
  southEdge: string;
  westEdge: string;
  rotation: number;
  isHighlighted: boolean;
  highlightType: string;
}

export interface ExportResult {
  success: boolean;
  message: string;
  csvData?: string;
  downloadUrl?: string;
}

export interface ImportResult {
  success: boolean;
  message: string;
  grid?: GridCell[];
  highlightedCells?: Set<string>;
  highlightType?: string;
}

/**
 * Export current grid state to CSV format with highlighting information
 */
export function exportGridToCSV(
  grid: GridCell[], 
  highlightedTiles: Set<string>, 
  highlightType: string,
  gridWidth: number = 12,
  gridHeight: number = 8
): ExportResult {
  try {
    const exportData: GridExportData[] = [];
    
    // Convert grid to export format
    grid.forEach((cell) => {
      if (cell.tile) {
        const cellKey = `${cell.x}-${cell.y}`;
        const isHighlighted = highlightedTiles.has(cellKey);
        
        exportData.push({
          row: cell.y + 1, // 1-based for user friendliness
          col: cell.x + 1, // 1-based for user friendliness
          tileId: cell.tile.id,
          northEdge: cell.tile.edgeN,
          eastEdge: cell.tile.edgeE,
          southEdge: cell.tile.edgeS,
          westEdge: cell.tile.edgeW,
          rotation: cell.rotation || 0,
          isHighlighted,
          highlightType: isHighlighted ? highlightType : ''
        });
      }
    });

    // Generate CSV header
    const headers = [
      'row',
      'col',
      'tileId',
      'northEdge',
      'eastEdge', 
      'southEdge',
      'westEdge',
      'rotation',
      'isHighlighted',
      'highlightType'
    ];

    // Generate CSV rows
    const csvRows = [
      headers.join(','),
      ...exportData.map(row => [
        row.row,
        row.col,
        row.tileId,
        row.northEdge,
        row.eastEdge,
        row.southEdge,
        row.westEdge,
        row.rotation,
        row.isHighlighted,
        row.highlightType
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    
    // Create download URL
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const downloadUrl = URL.createObjectURL(blob);
    
    return {
      success: true,
      message: `Exported ${exportData.length} tiles with highlighting data`,
      csvData: csvContent,
      downloadUrl
    };
  } catch (error) {
    return {
      success: false,
      message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Import grid state from CSV data with highlighting restoration
 */
export function importGridFromCSV(
  csvData: string,
  allTiles: TileData[],
  gridWidth: number = 12,
  gridHeight: number = 8
): ImportResult {
  try {
    const lines = csvData.trim().split('\n');
    
    if (lines.length < 2) {
      return {
        success: false,
        message: 'CSV file appears to be empty or invalid'
      };
    }

    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim());
    const expectedHeaders = [
      'row', 'col', 'tileId', 'northEdge', 'eastEdge', 
      'southEdge', 'westEdge', 'rotation', 'isHighlighted', 'highlightType'
    ];

    // Validate headers (be flexible about order and optional fields)
    const requiredHeaders = ['row', 'col', 'tileId'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return {
        success: false,
        message: `Missing required headers: ${missingHeaders.join(', ')}`
      };
    }

    // Create tile lookup map
    const tileMap = new Map<string, TileData>();
    allTiles.forEach(tile => tileMap.set(tile.id, tile));

    // Initialize empty grid
    const newGrid: GridCell[] = [];
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        newGrid.push({ x, y });
      }
    }

    // Parse data rows
    const highlightedCells = new Set<string>();
    let highlightType = '';
    const errors: string[] = [];
    let successCount = 0;

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim());
        const rowData: any = {};
        
        headers.forEach((header, index) => {
          if (index < values.length) {
            rowData[header] = values[index];
          }
        });

        // Parse required fields
        const row = parseInt(rowData.row) - 1; // Convert back to 0-based
        const col = parseInt(rowData.col) - 1; // Convert back to 0-based
        const tileId = rowData.tileId;

        // Validate position
        if (row < 0 || row >= gridHeight || col < 0 || col >= gridWidth) {
          errors.push(`Row ${i + 1}: Invalid position (${col + 1}, ${row + 1})`);
          continue;
        }

        // Find tile
        const tile = tileMap.get(tileId);
        if (!tile) {
          errors.push(`Row ${i + 1}: Tile '${tileId}' not found in current dataset`);
          continue;
        }

        // Validate edge data if provided
        if (rowData.northEdge && tile.edgeN !== rowData.northEdge) {
          errors.push(`Row ${i + 1}: Edge mismatch for tile '${tileId}' (expected N: ${tile.edgeN}, got: ${rowData.northEdge})`);
          continue;
        }

        // Place tile in grid
        const gridIndex = row * gridWidth + col;
        newGrid[gridIndex] = {
          ...newGrid[gridIndex],
          tile,
          rotation: parseInt(rowData.rotation) || 0
        };

        // Handle highlighting
        if (rowData.isHighlighted === 'true') {
          const cellKey = `${col}-${row}`;
          highlightedCells.add(cellKey);
          if (rowData.highlightType && !highlightType) {
            highlightType = rowData.highlightType;
          }
        }

        successCount++;
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`);
      }
    }

    // Check for duplicate tile placements
    const usedTiles = new Set<string>();
    const duplicates: string[] = [];
    newGrid.forEach(cell => {
      if (cell.tile) {
        if (usedTiles.has(cell.tile.id)) {
          duplicates.push(cell.tile.id);
        }
        usedTiles.add(cell.tile.id);
      }
    });

    let message = `Import completed: ${successCount} tiles placed`;
    if (errors.length > 0) {
      message += `, ${errors.length} errors`;
    }
    if (duplicates.length > 0) {
      message += `, ${duplicates.length} duplicate tiles detected`;
    }
    if (highlightedCells.size > 0) {
      message += `, ${highlightedCells.size} highlighted cells restored`;
    }

    return {
      success: errors.length < successCount, // Consider successful if more successes than errors
      message,
      grid: newGrid,
      highlightedCells,
      highlightType
    };
  } catch (error) {
    return {
      success: false,
      message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Trigger download of CSV file
 */
export function downloadCSV(csvData: string, filename: string = 'grid-export.csv'): void {
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Validate CSV file before importing
 */
export function validateCSVFile(file: File): Promise<{ valid: boolean; message: string; data?: string }> {
  return new Promise((resolve) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      resolve({ valid: false, message: 'Please select a CSV file' });
      return;
    }

    if (file.size > 1024 * 1024) { // 1MB limit
      resolve({ valid: false, message: 'CSV file is too large (max 1MB)' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result as string;
      if (!data) {
        resolve({ valid: false, message: 'Failed to read file' });
        return;
      }

      // Basic validation
      const lines = data.trim().split('\n');
      if (lines.length < 2) {
        resolve({ valid: false, message: 'CSV file appears to be empty' });
        return;
      }

      resolve({ valid: true, message: 'CSV file is valid', data });
    };

    reader.onerror = () => {
      resolve({ valid: false, message: 'Failed to read file' });
    };

    reader.readAsText(file);
  });
}