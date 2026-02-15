/**
 * useColumnSelection Hook
 * Manages column selection state with drag reordering support
 */

import { useState, useCallback, useEffect, useRef } from 'react';

export interface UseColumnSelectionParams {
  availableColumns: string[];
  initialSelected?: string[];
}

export interface UseColumnSelectionResult {
  selectedColumns: string[];
  toggleColumn: (column: string) => void;
  reorderColumns: (result: { source: { index: number }; destination: { index: number } | null }) => void;
  selectAll: () => void;
  deselectAll: () => void;
  removeColumn: (column: string) => void;
  isColumnSelected: (column: string) => boolean;
}

/**
 * Hook to manage column selection with drag reordering
 */
export function useColumnSelection({
  availableColumns,
  initialSelected,
}: UseColumnSelectionParams): UseColumnSelectionResult {
  // Track if we've done initial auto-selection
  const didAutoSelect = useRef<string[]>([]);

  const [selectedColumns, setSelectedColumns] = useState<string[]>(() => {
    if (initialSelected) {
      return initialSelected;
    }
    return [];
  });

  // Auto-select all columns on initial load if none selected
  useEffect(() => {
    if (didAutoSelect.current.length === 0 && availableColumns.length > 0 && selectedColumns.length === 0) {
      setSelectedColumns(availableColumns);
      didAutoSelect.current = availableColumns;
    }
  }, [availableColumns, selectedColumns.length]);

  // Reset auto-selection flag when data changes
  useEffect(() => {
    if (availableColumns.length === 0 || selectedColumns.length === 0) {
      didAutoSelect.current = [];
    }
    // Only track changes to available and selected columns
     
  }, [availableColumns.length, selectedColumns.length]);

  const toggleColumn = useCallback((column: string) => {
    setSelectedColumns(prev => {
      const isCurrentlySelected = prev.includes(column);
      let newSelected: string[];

      if (isCurrentlySelected) {
        newSelected = prev.filter(c => c !== column);
      } else {
        newSelected = [...prev, column];
      }

      // Preserve order of currently selected columns, but add new ones at the end in their original available order
      const orderedSelected = availableColumns.filter(c => newSelected.includes(c));
      const remainingSelected = newSelected.filter(c => !orderedSelected.includes(c));

      return [...orderedSelected, ...remainingSelected];
    });
  }, [availableColumns]);

  const reorderColumns = useCallback((result: { source: { index: number }; destination: { index: number } | null }) => {
    if (!result.destination) {
      return;
    }

    setSelectedColumns(prev => {
      const reorderedColumns = Array.from(prev);
      const [removed] = reorderedColumns.splice(result.source.index, 1);
      reorderedColumns.splice(result.destination.index, 0, removed);
      return reorderedColumns;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedColumns(availableColumns);
  }, [availableColumns]);

  const deselectAll = useCallback(() => {
    setSelectedColumns([]);
  }, []);

  const removeColumn = useCallback((column: string) => {
    setSelectedColumns(prev => prev.filter(c => c !== column));
  }, []);

  const isColumnSelected = useCallback((column: string) => {
    return selectedColumns.includes(column);
  }, [selectedColumns]);

  return {
    selectedColumns,
    toggleColumn,
    reorderColumns,
    selectAll,
    deselectAll,
    removeColumn,
    isColumnSelected,
  };
}
