import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Box, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, Button,
  TableSortLabel, TextField, InputAdornment, IconButton, TablePagination, Menu, MenuItem, FormControlLabel, Checkbox, Divider, Switch, FormGroup,
  Dialog, DialogTitle, DialogContent, Popover, List, ListItemButton, ListItemText, ListItemIcon, Chip, Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FilterListIcon from '@mui/icons-material/FilterList';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import * as XLSX from 'xlsx';
import { PDFExportDialog } from './PDFExport';
import DashboardView from './DashboardView';
import ErrorBoundary from './common/ErrorBoundary';
import { debug } from '../utils/logger';
import type { PDFGenerationContext } from '../types';

// Define a type with index signature for row data access
type DataRow = Record<string, unknown> & { _stableIndex?: number; _originalName?: string; _sourceFileName?: string; _sourceSheetName?: string; [key: string]: unknown };

interface DetailedDataViewProps {
  data: DataRow[];
  filteredData?: DataRow[]; // Optional pre-computed filtered data
  nameColumn: string | null;
  headerRowIndex: number; // Which row contains the actual headers (1-indexed)
  selectedUniqueNames: string[];
  onToggleFullScreen: () => void;
  isFullScreen: boolean;
  columnVisibility: Record<string, boolean>;
  setColumnVisibility: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  columnMapping?: Record<string, string>; // Optional column mapping for consistency
}

type Order = 'asc' | 'desc';

interface HeadCell {
  id: string; // The internal data key
  label: string; // The display label
  numeric: boolean; // Not strictly used here, but good practice
}

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  const aValue = a[orderBy];
  const bValue = b[orderBy];

  // Handle null/undefined values for comparison
  if (aValue === null || aValue === undefined) return bValue === null || bValue === undefined ? 0 : 1;
  if (bValue === null || bValue === undefined) return -1;

  if (typeof aValue === 'string' && typeof bValue === 'string') {
    return bValue.localeCompare(aValue);
  }
  if (typeof aValue === 'number' && typeof bValue === 'number') {
    return bValue - aValue;
  }
  // Fallback for other types, convert to string
  return String(bValue).localeCompare(String(aValue));
}

function getComparator<Key extends string>(
  order: Order,
  orderBy: Key,
): (
  a: { [key in Key]: any },
  b: { [key in Key]: any },
) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

// This function is for sorting an array stably
function stableSort<T>(array: readonly T[], comparator: (a: T, b: T) => number) {
  const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}


const DetailedDataView: React.FC<DetailedDataViewProps> = ({
  data,
  filteredData: propsFilteredData,
  nameColumn,
  headerRowIndex,
  selectedUniqueNames,
  onToggleFullScreen,
  isFullScreen,
  columnVisibility,
  setColumnVisibility,
  columnMapping: propsColumnMapping
}) => {
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [includedRowIndices, setIncludedRowIndices] = useState<Set<number>>(new Set()); // Track rows to include in export

  // Load auto-deselect preference from localStorage
  const [autoDeselectZeros, setAutoDeselectZeros] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('excel-processor-auto-deselect-zeros');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [showPDFDialog, setShowPDFDialog] = useState<boolean>(false); // PDF export dialog state
  const [showDashboardDialog, setShowDashboardDialog] = useState<boolean>(false); // Dashboard dialog state
  const [hideDeselectedRows, setHideDeselectedRows] = useState<boolean>(() => {
    // Persist "hide deselected" setting to localStorage
    try {
      const saved = localStorage.getItem('excel-processor-hide-deselected');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // Column filter state
  const [columnFilters, setColumnFilters] = useState<Record<string, Set<string>>>({}); // columnId -> Set of included values
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);
  const [filterSearchTerm, setFilterSearchTerm] = useState<string>('');

  // Load column order from localStorage on mount
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('excel-processor-column-order');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Helper to get the actual column name from the header row
  const getActualColumnName = useMemo(() => {
    if (!nameColumn || data.length === 0) return nameColumn;
    const isPlaceholder = (k: string) => /^[A-Z]+$/.test(k) || /^__EMPTY/.test(k);
    // If the selected column key is already human-readable, use it directly
    if (!isPlaceholder(nameColumn)) return nameColumn;

    const headerRowIdx = headerRowIndex - 1;
    if (headerRowIdx >= 0 && headerRowIdx < data.length) {
      const headerRow = data[headerRowIdx];
      const headerValue = headerRow[nameColumn];
      if (headerValue !== undefined && headerValue !== null && headerValue !== '') {
        return String(headerValue);
      }
    }
    return nameColumn;
  }, [data, nameColumn, headerRowIndex]);

  // Helper to get value from a row, trying both actual name and original key
  const getRowValue = (row: any, originalKey: string | null, actualName: string | null) => {
    if (actualName && actualName in row) return row[actualName];
    if (originalKey) return row[originalKey];
    return undefined;
  };

  // Create a mapping of original keys to actual display names from header row
  const columnMapping = useMemo(() => {
    // If provided via props, use it
    if (propsColumnMapping) return propsColumnMapping;

    if (data.length === 0) return {};
    const headerRowIdx = headerRowIndex - 1;
    console.log('DetailedDataView - headerRowIndex:', headerRowIndex, 'headerRowIdx:', headerRowIdx);
    if (headerRowIdx < 0 || headerRowIdx >= data.length) return {};

    // If keys are already human-readable, use identity mapping
    const sampleRow = data[0];
    // Exclude all metadata/system keys (starting with underscore) from detection
    const nonMetaKeys = Object.keys(sampleRow).filter(k => !k.startsWith('_'));
    const isPlaceholder = (k: string) => /^[A-Z]+$/.test(k) || /^__EMPTY/.test(k);
    const allPlaceholders = nonMetaKeys.length > 0 && nonMetaKeys.every(isPlaceholder);

    const mapping: Record<string, string> = {};
    if (!allPlaceholders) {
      Object.keys(sampleRow).forEach(key => { mapping[key] = key; });
      console.log('DetailedDataView - columnMapping (identity):', mapping);
      return mapping;
    }

    // Otherwise, derive mapping from the chosen header row
    const headerRow = data[headerRowIdx];
    console.log('DetailedDataView - headerRow sample:', headerRow);
    Object.keys(headerRow).forEach(key => {
      const value = headerRow[key];
      if (value !== undefined && value !== null && value !== '') {
        mapping[key] = String(value);
      } else {
        mapping[key] = key;
      }
    });

    console.log('DetailedDataView - columnMapping:', mapping);
    return mapping;
  }, [data, headerRowIndex, propsColumnMapping]);

  // Use provided filteredData or compute locally
  const filteredData = useMemo(() => {
    // If pre-computed filteredData is provided, use it
    if (propsFilteredData !== undefined) {
      return propsFilteredData;
    }

    // Otherwise compute locally (backward compatibility)
    if (!nameColumn || selectedUniqueNames.length === 0 || data.length === 0) {
      return [];
    }
    const headerRowIdx = headerRowIndex - 1;
    // Use Set for O(1) lookup instead of Array.includes() which is O(n)
    const selectedNamesSet = new Set(selectedUniqueNames);

    return data
      .filter((_, idx) => idx !== headerRowIdx) // Exclude header row
      .filter(row => {
        const value = getRowValue(row, nameColumn, getActualColumnName);
        // Check both the merged display name and the original name (if it exists due to merging)
        // This handles the case where names were selected before merging was applied
        return selectedNamesSet.has(value) || (row._originalName && selectedNamesSet.has(row._originalName));
      });
  }, [propsFilteredData, data, nameColumn, headerRowIndex, selectedUniqueNames, getActualColumnName]);


  const allAvailableHeaders = useMemo(() => {
    if (filteredData.length === 0) return [];
    const keys = Object.keys(filteredData[0]);
    let dynamicHeaders: HeadCell[] = [];

    // Always add source file columns first if they exist
    if (keys.includes('_sourceFileName')) {
      dynamicHeaders.push({ id: '_sourceFileName', label: 'Source File', numeric: false });
      dynamicHeaders.push({ id: '_sourceSheetName', label: 'Source Sheet', numeric: false });
    }

    // For other columns, use the actual display names from the header row
    keys.filter(key => key !== '_sourceFileName' && key !== '_sourceSheetName')
      .forEach(key => {
        const displayName = columnMapping[key] || key;
        dynamicHeaders.push({
          id: key,
          label: displayName,
          numeric: typeof filteredData[0][key] === 'number'
        });
      });

    // Disambiguate duplicate labels (e.g., data column named "Source File" vs metadata column)
    const counts: Record<string, number> = {};
    dynamicHeaders.forEach(h => { counts[h.label] = (counts[h.label] || 0) + 1; });
    if (Object.values(counts).some(c => c > 1)) {
      dynamicHeaders = dynamicHeaders.map(h => {
        if (counts[h.label] > 1) {
          const isMeta = h.id === '_sourceFileName' || h.id === '_sourceSheetName';
          return { ...h, label: `${h.label} ${isMeta ? '(origin)' : '(data)'}` } as HeadCell;
        }
        return h;
      });
    }

    // If custom order exists, sort by it
    if (columnOrder.length > 0) {
      const orderedHeaders: HeadCell[] = [];
      columnOrder.forEach(id => {
        const header = dynamicHeaders.find(h => h.id === id);
        if (header) orderedHeaders.push(header);
      });
      // Add any new columns that weren't in the custom order
      dynamicHeaders.forEach(header => {
        if (!columnOrder.includes(header.id)) {
          orderedHeaders.push(header);
        }
      });
      return orderedHeaders;
    }

    return dynamicHeaders;
  }, [filteredData, columnOrder, columnMapping]);

  // Initialize column visibility when headers change (only if not already set)
  useEffect(() => {
    if (allAvailableHeaders.length > 0 && Object.keys(columnVisibility).length === 0) {
      const initialVisibility: Record<string, boolean> = {};
      allAvailableHeaders.forEach(header => {
        initialVisibility[header.id] = true; // All columns visible by default
      });
      setColumnVisibility(initialVisibility);
    }
  }, [allAvailableHeaders, setColumnVisibility]);

  // Persist auto-deselect zeros preference to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('excel-processor-auto-deselect-zeros', JSON.stringify(autoDeselectZeros));
    } catch (error) {
      console.warn('Could not save auto-deselect preference to localStorage:', error);
    }
  }, [autoDeselectZeros]);

  // When opening the Dashboard dialog, nudge charts to measure correctly after dialogs' transition
  useEffect(() => {
    if (showDashboardDialog) {
      try {
        // Immediate and delayed resize events to catch post-transition layout
        window.dispatchEvent(new Event('resize'));
        const t1 = setTimeout(() => { try { window.dispatchEvent(new Event('resize')); } catch {} }, 80);
        const t2 = setTimeout(() => { try { window.dispatchEvent(new Event('resize')); } catch {} }, 200);
        return () => { clearTimeout(t1); clearTimeout(t2); };
      } catch {}
    }
  }, [showDashboardDialog]);


  // Headers that are currently visible
  const visibleHeaders = useMemo(() => {
    return allAvailableHeaders.filter(header => columnVisibility[header.id]);
  }, [allAvailableHeaders, columnVisibility]);

  // Column Filter Functions (must be defined before filteredAndSortedData)

  // Get unique values for a column
  const getUniqueColumnValues = useCallback((columnId: string): string[] => {
    const values = new Set<string>();
    filteredData.forEach(row => {
      let value: any;
      if (columnId === '_sourceFileName' || columnId === '_sourceSheetName') {
        value = row[columnId];
      } else {
        const actualName = columnMapping[columnId] || columnId;
        value = getRowValue(row, columnId, actualName);
      }
      if (value !== null && value !== undefined) {
        values.add(String(value));
      } else {
        values.add('(empty)');
      }
    });
    return Array.from(values).sort((a, b) => {
      // Put (empty) at the end
      if (a === '(empty)') return 1;
      if (b === '(empty)') return -1;
      return a.localeCompare(b, 'de');
    });
  }, [filteredData, columnMapping]);

  // Check if a column has active filters
  const hasColumnFilter = useCallback((columnId: string): boolean => {
    const filter = columnFilters[columnId];
    if (!filter) return false;
    const allValues = getUniqueColumnValues(columnId);
    return filter.size < allValues.length;
  }, [columnFilters, getUniqueColumnValues]);

  // Check if a row passes all column filters
  const rowPassesColumnFilters = useCallback((row: any): boolean => {
    for (const header of visibleHeaders) {
      const filter = columnFilters[header.id];
      if (!filter || filter.size === 0) continue;

      let value: any;
      if (header.id === '_sourceFileName' || header.id === '_sourceSheetName') {
        value = row[header.id];
      } else {
        const actualName = columnMapping[header.id] || header.id;
        value = getRowValue(row, header.id, actualName);
      }

      const stringValue = value !== null && value !== undefined ? String(value) : '(empty)';
      if (!filter.has(stringValue)) {
        return false;
      }
    }
    return true;
  }, [visibleHeaders, columnFilters, columnMapping]);

  // Set default sort to first column when data loads
  useEffect(() => {
    if (visibleHeaders.length > 0 && !orderBy) {
      setOrderBy(visibleHeaders[0].id);
      setOrder('asc');
    }
  }, [visibleHeaders]);


  const handleRequestSort = (_event: React.MouseEvent<unknown>, property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Add stable index to filtered data for consistent row tracking
  const filteredDataWithIndex = useMemo(() => {
    return filteredData.map((row, index) => ({
      ...row,
      _stableIndex: index,
    }));
  }, [filteredData]);

  const filteredAndSortedData = useMemo(() => {
    let currentData = filteredDataWithIndex;

    // Apply search filter
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      currentData = currentData.filter(row =>
        Object.keys(row).some(key => {
          if (key === '_stableIndex') return false;
          // For data columns, try to get the actual display value
          if (key === '_sourceFileName' || key === '_sourceSheetName') {
            return String(row[key]).toLowerCase().includes(lowerCaseSearchTerm);
          }
          const actualName = columnMapping[key] || key;
          const value = getRowValue(row, key, actualName);
          return String(value).toLowerCase().includes(lowerCaseSearchTerm);
        })
      );
    }

    // Apply column filters
    currentData = currentData.filter(row => rowPassesColumnFilters(row));

    // Apply sorting
    if (orderBy) {
      currentData = stableSort(currentData, (a, b) => {
        // Get values using the actual column name for sorting
        let aValue, bValue;
        if (orderBy === '_sourceFileName' || orderBy === '_sourceSheetName') {
          aValue = a[orderBy];
          bValue = b[orderBy];
        } else {
          const actualName = columnMapping[orderBy] || orderBy;
          aValue = getRowValue(a, orderBy, actualName);
          bValue = getRowValue(b, orderBy, actualName);
        }
        return getComparator(order, orderBy)({ [orderBy]: aValue }, { [orderBy]: bValue });
      });
    }

    return currentData;
  }, [filteredData, searchTerm, order, orderBy, columnMapping, rowPassesColumnFilters]);

  // Initialize all rows as included when the base filtered data or visible columns change
  useEffect(() => {
    if (filteredData.length === 0) {
      setIncludedRowIndices(new Set());
      return;
    }

    // Helper function to check if a string is purely numeric (no extra characters)
    const isPureNumericString = (str: string): boolean => {
      return /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(str.trim());
    };

    // Helper function to check if a row has no valid numeric values
    // Evaluates only currently visible (non-metadata) columns
    const hasNoValidNumericValues = (row: any, visibleColumnIds: Set<string>): boolean => {
      if (visibleColumnIds.size === 0) {
        // If there are no visible data columns, do not auto-deselect anything
        return false;
      }
      for (const key of visibleColumnIds) {
        const value = (row as any)[key];
        if (value === null || value === undefined || value === '' || typeof value === 'boolean') {
          continue;
        }

        if (typeof value === 'number') {
          if (value !== 0) {
            return false;
          }
          continue;
        }

        if (typeof value === 'string') {
          const trimmedValue = value.trim();
          if (isPureNumericString(trimmedValue)) {
            const numValue = parseFloat(trimmedValue);
            if (!isNaN(numValue) && numValue !== 0) {
              return false;
            }
          }
          continue;
        }
      }
      return true;
    };

    // Build the set of currently visible, non-metadata column IDs
    const visibleDataColumnIds = new Set<string>(
      visibleHeaders
        .map(h => h.id)
        .filter(id => id !== '_sourceFileName' && id !== '_sourceSheetName')
    );

    // Select all rows using stable indices
    const newSet = new Set<number>();
    filteredData.forEach((row, index) => {
      if (autoDeselectZeros && hasNoValidNumericValues(row, visibleDataColumnIds)) {
        return;
      }
      newSet.add(index);
    });

    setIncludedRowIndices(newSet);
  }, [filteredData, autoDeselectZeros, visibleHeaders]); // Recompute when visible columns change

  // Calculate column totals (only for included rows)
  const columnTotals = useMemo(() => {
    const totals: { [key: string]: number | string } = {};
    visibleHeaders.forEach(header => {
      let sum = 0;
      let hasNumericValue = false;
      filteredAndSortedData.forEach((row) => {
        // Skip non-included rows
        if (!includedRowIndices.has(row._stableIndex)) return;

        let value;
        if (header.id === '_sourceFileName' || header.id === '_sourceSheetName') {
          value = row[header.id];
        } else {
          const actualName = columnMapping[header.id] || header.id;
          value = getRowValue(row, header.id, actualName);
        }

        // Skip non-numeric values (but don't mark column as non-numeric)
        if (value === null || value === undefined || value === '' || typeof value === 'boolean') {
          return;
        }

        const numValue = parseFloat(String(value));
        if (!isNaN(numValue)) {
          sum += numValue;
          hasNumericValue = true;
        }
      });
      totals[header.id] = hasNumericValue ? sum : '';
    });
    return totals;
  }, [filteredAndSortedData, visibleHeaders, columnMapping, includedRowIndices]);

  // Prepare dashboard data (only included rows and visible columns; always include origin metadata)
  const dashboardData = useMemo(() => {
    if (filteredAndSortedData.length === 0) {
      return [];
    }

    // Build the list of visible column IDs
    const visibleColumnIds = visibleHeaders.map(h => h.id);

    // Filter to included rows and only visible columns
    return filteredAndSortedData
      .filter((row) => includedRowIndices.has(row._stableIndex))
      .map(row => {
        const filteredRow: Record<string, any> = {};
        // Always include metadata columns for downstream features (e.g., filename date extraction)
        if (row._sourceFileName !== undefined) filteredRow._sourceFileName = row._sourceFileName;
        if (row._sourceSheetName !== undefined) filteredRow._sourceSheetName = row._sourceSheetName;
        visibleColumnIds.forEach((colId: string) => {
          if (colId === '_stableIndex') return;
          (filteredRow as Record<string, unknown>)[colId] = (row as Record<string, unknown>)[colId];
        });
        return filteredRow;
      });
  }, [filteredAndSortedData, visibleHeaders, includedRowIndices]);

  // Create column mapping for dashboard (only visible columns)
  const dashboardColumnMapping = useMemo(() => {
    const mapping: Record<string, string> = {};
    visibleHeaders.forEach(header => {
      mapping[header.id] = header.label;
    });
    // Provide friendly labels for metadata columns even if not visible
    mapping._sourceFileName = mapping._sourceFileName || 'Origin File';
    mapping._sourceSheetName = mapping._sourceSheetName || 'Origin Sheet';
    return mapping;
  }, [visibleHeaders]);

  // Debug: log when dashboard data prepared or dialog opened
  useEffect(() => {
    if (!showDashboardDialog) return;
    debug('[Dashboard]', 'dialog open; prepared data', {
      rows: dashboardData.length,
      cols: dashboardData.length > 0 ? Object.keys(dashboardData[0]).length : 0,
      sampleCols: dashboardData.length > 0 ? Object.keys(dashboardData[0]).slice(0, 10) : [],
    });
  }, [showDashboardDialog, dashboardData]);


  const handleExportCsv = () => {
    if (filteredAndSortedData.length > 0) {
      // Only export included rows
      const dataToExport = filteredAndSortedData
        .filter((row) => includedRowIndices.has(row._stableIndex))
        .map(row => {
          const newRow: { [key: string]: any } = {};
          visibleHeaders.forEach(header => {
            // Export using the actual column value
            let value;
            if (header.id === '_sourceFileName' || header.id === '_sourceSheetName') {
              value = row[header.id];
            } else {
              const actualName = columnMapping[header.id] || header.id;
              value = getRowValue(row, header.id, actualName);
            }
            newRow[header.label] = value;
          });
          return newRow;
        });
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "SelectedData");
      const fileName = selectedUniqueNames.length > 1 ? 'selected_data.csv' : `${selectedUniqueNames[0]}_data.csv`;
      XLSX.writeFile(wb, fileName);
    }
  };

  const preparePDFContext = (): PDFGenerationContext => ({
    data: filteredAndSortedData,
    visibleHeaders: visibleHeaders,
    includedIndices: includedRowIndices,
    columnTotals: Object.fromEntries(
      Object.entries(columnTotals).filter(([_, value]) => typeof value === 'number')
    ) as Record<string, number>,
    selectedNames: selectedUniqueNames,
    sourceFiles: Array.from(new Set(filteredAndSortedData.map(row => row._sourceFileName as string).filter((v): v is string => Boolean(v)))),
    sourceSheets: Array.from(new Set(filteredAndSortedData.map(row => row._sourceSheetName as string).filter((v): v is string => Boolean(v)))),
  });

  const handleToggleRowInclude = (stableIndex: number) => {
    setIncludedRowIndices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stableIndex)) {
        newSet.delete(stableIndex);
      } else {
        newSet.add(stableIndex);
      }
      return newSet;
    });
  };

  const handleSelectAllRows = () => {
    // Helper function to check if a string is purely numeric (no extra characters)
    const isPureNumericString = (str: string): boolean => {
      return /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(str.trim());
    };

    // Helper function to check if a row has no valid numeric values in visible columns
    const hasNoValidNumericValues = (row: any): boolean => {
      const visibleColumnIds = new Set(visibleHeaders.map(h => h.id));

      for (const [key, value] of Object.entries(row)) {
        if (!visibleColumnIds.has(key)) continue;
        if (key === '_sourceFileName' || key === '_sourceSheetName' || key === '_stableIndex') continue;
        if (value === null || value === undefined || value === '' || typeof value === 'boolean') {
          continue;
        }

        // Check if it's a number type
        if (typeof value === 'number') {
          if (value !== 0) {
            return false; // Found non-zero number
          }
          continue; // It's zero, continue checking
        }

        // If it's a string, check if it's purely numeric
        if (typeof value === 'string') {
          const trimmedValue = value.trim();
          if (isPureNumericString(trimmedValue)) {
            const numValue = parseFloat(trimmedValue);
            if (!isNaN(numValue) && numValue !== 0) {
              return false; // Found non-zero number in string
            }
          }
          // Not a pure numeric string, skip
          continue;
        }
      }
      return true; // No valid non-zero numeric values found
    };

    // Add visible rows to selection, excluding rows without valid numeric values if toggle is ON
    setIncludedRowIndices(prev => {
      const newSet = new Set(prev);
      filteredAndSortedData.forEach((row) => {
        if (autoDeselectZeros && hasNoValidNumericValues(row)) {
          return;
        }
        newSet.add(row._stableIndex);
      });
      return newSet;
    });
  };

  const handleDeselectAllRows = () => {
    // Remove only visible rows from selection (not all rows)
    setIncludedRowIndices(prev => {
      const newSet = new Set(prev);
      filteredAndSortedData.forEach((row) => {
        newSet.delete(row._stableIndex);
      });
      return newSet;
    });
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleColumnMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleColumnMenuClose = () => {
    setAnchorEl(null);
  };

  const handleToggleColumnVisibility = (columnId: string) => {
    setColumnVisibility(prev => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  };

  const handleSelectAllColumns = () => {
    const newVisibility: Record<string, boolean> = {};
    allAvailableHeaders.forEach(header => {
      newVisibility[header.id] = true;
    });
    setColumnVisibility(newVisibility);
  };

  const handleUnselectAllColumns = () => {
    const newVisibility: Record<string, boolean> = {};
    allAvailableHeaders.forEach(header => {
      newVisibility[header.id] = false;
    });
    setColumnVisibility(newVisibility);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(allAvailableHeaders);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update column order with the new sequence
    const newOrder = items.map(item => item.id);
    setColumnOrder(newOrder);

    // Save to localStorage
    try {
      localStorage.setItem('excel-processor-column-order', JSON.stringify(newOrder));
    } catch (error) {
      console.warn('Could not save column order to localStorage:', error);
    }
  };

  // Check if any column has active filters
  const hasAnyColumnFilter = useMemo(() => {
    return visibleHeaders.some(header => hasColumnFilter(header.id));
  }, [visibleHeaders, hasColumnFilter]);

  // Open filter popover for a column
  const handleFilterClick = (event: React.MouseEvent<HTMLElement>, columnId: string) => {
    setFilterAnchorEl(event.currentTarget);
    setActiveFilterColumn(columnId);
    setFilterSearchTerm('');
  };

  // Close filter popover
  const handleFilterClose = () => {
    setFilterAnchorEl(null);
    setActiveFilterColumn(null);
    setFilterSearchTerm('');
  };

  // Toggle a value in the column filter
  const handleToggleFilterValue = (columnId: string, value: string) => {
    setColumnFilters(prev => {
      const currentFilter = prev[columnId] || new Set(getUniqueColumnValues(columnId));
      const newFilter = new Set(currentFilter);

      if (newFilter.has(value)) {
        newFilter.delete(value);
      } else {
        newFilter.add(value);
      }

      return {
        ...prev,
        [columnId]: newFilter,
      };
    });
  };

  // Select all values for a column filter
  const handleSelectAllFilterValues = (columnId: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnId]: new Set(getUniqueColumnValues(columnId)),
    }));
  };

  // Deselect all values for a column filter
  const handleDeselectAllFilterValues = (columnId: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnId]: new Set(), // Empty set = nothing selected
    }));
  };

  // Clear filter for a column (reset to all selected)
  const handleClearColumnFilter = (columnId: string) => {
    setColumnFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[columnId];
      return newFilters;
    });
  };

  // Clear all column filters
  const handleClearAllColumnFilters = () => {
    setColumnFilters({});
  };

  // Initialize column filters when data changes
  useEffect(() => {
    // Initialize filters for all visible columns
    const newFilters: Record<string, Set<string>> = {};
    visibleHeaders.forEach(header => {
      if (!columnFilters[header.id]) {
        newFilters[header.id] = new Set(getUniqueColumnValues(header.id));
      }
    });
    if (Object.keys(newFilters).length > 0) {
      setColumnFilters(prev => ({ ...newFilters, ...prev }));
    }
  }, [visibleHeaders, getUniqueColumnValues]);

  const allColumnsSelected = allAvailableHeaders.length > 0 &&
    allAvailableHeaders.every(header => columnVisibility[header.id]);


  if (selectedUniqueNames.length === 0 || data.length === 0) {
    return null;
  }

  // Data to display (optionally hide deselected rows)
  const displayData = hideDeselectedRows
    ? filteredAndSortedData.filter(row => includedRowIndices.has(row._stableIndex))
    : filteredAndSortedData;

  const paginatedData = rowsPerPage > 0
    ? displayData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : displayData;

  const emptyRows = rowsPerPage - Math.min(rowsPerPage, displayData.length - page * rowsPerPage);

  return (
    <Box sx={{ mt: isFullScreen ? 0 : 4, width: '100%', height: isFullScreen ? '100%' : 'auto', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" gutterBottom={!isFullScreen}>
          Details for:{' '}
          <strong>
            {selectedUniqueNames.length <= 3
              ? selectedUniqueNames.join(', ')
              : `${selectedUniqueNames.slice(0, 2).join(', ')} and ${selectedUniqueNames.length - 2} more`}
          </strong>
          {' '}({filteredAndSortedData.length} rows)
        </Typography>
        <Box>
          <IconButton onClick={onToggleFullScreen} size="small" sx={{ ml: 1 }}>
            <FullscreenIcon />
          </IconButton>
          <IconButton onClick={handleColumnMenuClick} size="small" sx={{ ml: 1 }}>
            <ViewColumnIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleColumnMenuClose}
            PaperProps={{
              sx: {
                maxHeight: 600,
                width: 320,
              }
            }}
          >
            <MenuItem dense onClick={handleSelectAllColumns} disabled={allColumnsSelected}>
              <Typography variant="body2">Select All</Typography>
            </MenuItem>
            <MenuItem dense onClick={handleUnselectAllColumns} disabled={!allColumnsSelected}>
              <Typography variant="body2">Unselect All</Typography>
            </MenuItem>
            <Divider />
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="column-list">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {allAvailableHeaders.map((header, index) => (
                      <Draggable
                        key={header.id}
                        draggableId={header.id}
                        index={index}
                        disableInteractiveElementBlocking
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            style={{
                              ...provided.draggableProps.style,
                              backgroundColor: snapshot.isDragging ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                            }}
                          >
                            <MenuItem dense disableRipple>
                              <Box
                                {...provided.dragHandleProps}
                                sx={{ display: 'flex', alignItems: 'center', mr: 1, cursor: 'grab' }}
                              >
                                <DragHandleIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                              </Box>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={columnVisibility[header.id]}
                                    onChange={() => handleToggleColumnVisibility(header.id)}
                                    size="small"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                }
                                label={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                    <Typography variant="body2">{header.label}</Typography>
                                    {header.id === '_sourceFileName' && (
                                      <Chip
                                        label="From filename"
                                        size="small"
                                        variant="outlined"
                                        color="info"
                                        sx={{
                                          fontSize: '0.7rem',
                                          height: 20,
                                          '& .MuiChip-label': { fontSize: '0.65rem' },
                                        }}
                                      />
                                    )}
                                    {header.id === '_sourceSheetName' && (
                                      <Chip
                                        label="From sheet"
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                          fontSize: '0.7rem',
                                          height: 20,
                                          '& .MuiChip-label': { fontSize: '0.65rem' },
                                        }}
                                      />
                                    )}
                                  </Box>
                                }
                                sx={{ ml: 0, flex: 1 }}
                              />
                            </MenuItem>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </Menu>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 1, alignItems: { xs: 'stretch', md: 'center' }, justifyContent: { xs: 'flex-start', md: 'space-between' }, mb: 2 }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search all columns..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(0); // Reset page on search
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton onClick={() => setSearchTerm('')} edge="end" size="small">
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ width: { xs: '100%', md: '30%' } }}
        />
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {includedRowIndices.size} of {filteredAndSortedData.length} rows selected
          </Typography>
          <FormGroup sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoDeselectZeros}
                  onChange={(e) => setAutoDeselectZeros(e.target.checked)}
                  size="small"
                />
              }
              label={
                <Tooltip title="Only checks currently visible data columns" arrow>
                  <span>Auto-deselect empty/zero-value rows</span>
                </Tooltip>
              }
              sx={{ mr: 1 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={hideDeselectedRows}
                  onChange={(e) => {
                    const newValue = e.target.checked;
                    setHideDeselectedRows(newValue);
                    // Persist to localStorage
                    try {
                      localStorage.setItem('excel-processor-hide-deselected', String(newValue));
                    } catch {}
                    setPage(0); // Reset to first page when toggling
                  }}
                  size="small"
                />
              }
              label={
                <Tooltip title="Temporarily hide deselected rows; selection still applies to exports" arrow>
                  <span>Hide deselected</span>
                </Tooltip>
              }
              sx={{ mr: 1 }}
            />
          </FormGroup>
          {(searchTerm || hasAnyColumnFilter) && (
            <>
              <Tooltip title="Select all currently visible rows (after search/filters)" arrow>
                <span>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleSelectAllRows}
                    disabled={filteredAndSortedData.length === 0}
                    sx={{ width: { xs: '100%', md: 'auto' } }}
                  >
                    Select All
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title="Deselect all currently visible rows (after search/filters)" arrow>
                <span>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleDeselectAllRows}
                    disabled={includedRowIndices.size === 0}
                    sx={{ width: { xs: '100%', md: 'auto' } }}
                  >
                    Deselect All
                  </Button>
                </span>
              </Tooltip>
            </>
          )}
          <Tooltip title="Exports included rows and currently visible columns" arrow>
            <span>
              <Button
                variant="contained"
                color="primary"
                onClick={handleExportCsv}
                disabled={includedRowIndices.size === 0}
                sx={{ width: { xs: '100%', md: 'auto' } }}
              >
                Export as CSV ({includedRowIndices.size})
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Generates PDF using included rows and visible columns" arrow>
            <span>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => setShowPDFDialog(true)}
                disabled={includedRowIndices.size === 0}
                startIcon={<PictureAsPdfIcon />}
                sx={{ width: { xs: '100%', md: 'auto' } }}
              >
                PDF ({includedRowIndices.size})
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Box>
      {/* Column Filter Info and Clear Button */}
      {hasAnyColumnFilter && (
        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            size="small"
            label="Column filters active"
            color="primary"
            variant="outlined"
            onDelete={handleClearAllColumnFilters}
            deleteIcon={<FilterAltOffIcon />}
          />
          <Button
            size="small"
            variant="text"
            onClick={handleClearAllColumnFilters}
            startIcon={<FilterAltOffIcon />}
          >
            Clear all filters
          </Button>
        </Box>
      )}
      <TableContainer component={Paper} sx={{ flexGrow: 1, overflow: 'auto' }}>
        <Table stickyHeader aria-label="detailed data table">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={(() => {
                    const visibleSelectedCount = filteredAndSortedData.filter(row => includedRowIndices.has(row._stableIndex)).length;
                    return visibleSelectedCount > 0 && visibleSelectedCount < filteredAndSortedData.length;
                  })()}
                  checked={(() => {
                    if (filteredAndSortedData.length === 0) return false;
                    return filteredAndSortedData.every(row => includedRowIndices.has(row._stableIndex));
                  })()}
                  onChange={() => {
                    const allVisibleSelected = filteredAndSortedData.every(row => includedRowIndices.has(row._stableIndex));
                    if (allVisibleSelected) {
                      handleDeselectAllRows();
                    } else {
                      handleSelectAllRows();
                    }
                  }}
                  inputProps={{ 'aria-label': 'select all visible rows' }}
                />
              </TableCell>
              {visibleHeaders.map((headCell, index) => (
                <TableCell
                  key={headCell.id}
                  align={headCell.numeric ? 'right' : 'left'}
                  padding="normal"
                  sortDirection={orderBy === headCell.id ? order : false}
                  sx={{ borderRight: index < visibleHeaders.length - 1 ? 1 : 0, borderColor: 'divider' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TableSortLabel
                      active={orderBy === headCell.id}
                      direction={orderBy === headCell.id ? order : 'asc'}
                      onClick={(event) => handleRequestSort(event, headCell.id)}
                    >
                      {headCell.label}
                    </TableSortLabel>
                    <Tooltip title={hasColumnFilter(headCell.id) ? 'Filter active' : 'Filter column'}>
                      <IconButton
                        size="small"
                        onClick={(e) => handleFilterClick(e, headCell.id)}
                        sx={{
                          ml: 0.5,
                          padding: 0.25,
                          color: hasColumnFilter(headCell.id) ? 'primary.main' : 'action.active',
                        }}
                      >
                        {hasColumnFilter(headCell.id) ? (
                          <FilterListIcon fontSize="small" />
                        ) : (
                          <FilterListIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((row, index) => {
              const isIncluded = includedRowIndices.has(row._stableIndex);
              return (<TableRow hover key={row._stableIndex} sx={{ opacity: isIncluded ? 1 : 0.5 }}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isIncluded}
                      onChange={() => handleToggleRowInclude(row._stableIndex)}
                      inputProps={{ 'aria-label': `select row ${index + 1}` }}
                    />
                  </TableCell>
                  {visibleHeaders.map((headCell, cellIndex) => {
                    let cellValue: any;
                    if (headCell.id === '_sourceFileName' || headCell.id === '_sourceSheetName') {
                      cellValue = row[headCell.id];
                    } else {
                      const actualName = columnMapping[headCell.id] || headCell.id;
                      cellValue = getRowValue(row, headCell.id, actualName);
                    }
                    return (<TableCell key={`${index}-${headCell.id}`} sx={{ borderRight: cellIndex < visibleHeaders.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                        {cellValue !== undefined && cellValue !== null ? String(cellValue) : ''}
                      </TableCell>);
                    })}
                </TableRow>);
            })}
            {emptyRows > 0 && (<TableRow style={{ height: (33) * emptyRows }}>
                <TableCell colSpan={visibleHeaders.length + 1} sx={{ borderRight: 0 }} />
              </TableRow>)}
            <TableRow sx={{ '& > td': { fontWeight: 'bold' } }}>
              <TableCell />
              {visibleHeaders.map((headCell, index) => (
                <TableCell key={`total-${headCell.id}`} align={index === 0 ? 'left' : headCell.numeric ? 'right' : 'left'} sx={{ borderRight: index < visibleHeaders.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                  {index === 0 ? 'Total' : (typeof columnTotals[headCell.id] === 'number' ? (columnTotals[headCell.id] as number).toFixed(2) : columnTotals[headCell.id])}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            variant="contained"
            color="info"
            onClick={() => {
              debug('[Dashboard]', 'Open clicked', {
                includedVisibleRows: filteredAndSortedData.filter(row => includedRowIndices.has(row._stableIndex)).length,
                totalVisibleRows: filteredAndSortedData.length,
                visibleHeaders: visibleHeaders.map(h => h.id),
              });
              setShowDashboardDialog(true);
            }}
            disabled={(() => {
              const visibleIncluded = filteredAndSortedData.filter(row => includedRowIndices.has(row._stableIndex)).length;
              return visibleIncluded === 0;
            })()}
            startIcon={<DashboardIcon />}
            size="small"
          >
            Dashboard ({(() => filteredAndSortedData.filter(row => includedRowIndices.has(row._stableIndex)).length)()})
          </Button>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
          component="div"
          count={displayData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>
      <PDFExportDialog
        open={showPDFDialog}
        onClose={() => setShowPDFDialog(false)}
        context={preparePDFContext()}
      />

      {/* Dashboard Dialog */}
      <Dialog
        fullScreen
        open={showDashboardDialog}
        onClose={() => setShowDashboardDialog(false)}
        TransitionProps={{
          onEntered: () => { try { window.dispatchEvent(new Event('resize')); } catch {} },
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DashboardIcon />
            <Typography variant="h6">Dashboard</Typography>
          </Box>
          <IconButton
            aria-label="close"
            onClick={() => setShowDashboardDialog(false)}
            sx={{ color: (theme) => theme.palette.grey[500] }}
          >
            <ClearIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <ErrorBoundary title="Dashboard failed to render.">
            <DashboardView
              data={dashboardData}
              columnMapping={dashboardColumnMapping}
              nameColumn={nameColumn}
              deferRendering={true}
            />
          </ErrorBoundary>
        </DialogContent>
      </Dialog>

      {/* Column Filter Popover */}
      <Popover
        open={Boolean(filterAnchorEl)}
        anchorEl={filterAnchorEl}
        onClose={handleFilterClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            maxHeight: '60vh',
            width: 320,
          },
        }}
      >
        {activeFilterColumn && (
          <Box>
            {/* Header */}
            <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2" gutterBottom>
                Filter: {visibleHeaders.find(h => h.id === activeFilterColumn)?.label}
              </Typography>
              <TextField
                size="small"
                placeholder="Search values..."
                value={filterSearchTerm}
                onChange={(e) => setFilterSearchTerm(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Actions */}
            <Box sx={{ px: 1.5, py: 1, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', gap: 1 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  onClick={() => handleSelectAllFilterValues(activeFilterColumn)}
                >
                  Select All
                </Button>
                <Button
                  size="small"
                  onClick={() => handleDeselectAllFilterValues(activeFilterColumn)}
                >
                  Deselect All
                </Button>
              </Box>
              <Button
                size="small"
                onClick={() => handleClearColumnFilter(activeFilterColumn)}
                color="error"
              >
                Reset
              </Button>
            </Box>

            {/* Value List */}
            <List dense sx={{ maxHeight: '55vh', overflow: 'auto', py: 0 }}>
              {getUniqueColumnValues(activeFilterColumn)
                .filter(value => !filterSearchTerm || value.toLowerCase().includes(filterSearchTerm.toLowerCase()))
                .map((value) => {
                  const filter = columnFilters[activeFilterColumn];
                  const isChecked = filter ? filter.has(value) : true;
                  return (
                    <ListItemButton
                      key={value}
                      dense
                      onClick={() => handleToggleFilterValue(activeFilterColumn, value)}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Checkbox
                          edge="start"
                          checked={isChecked}
                          size="small"
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={value || '(empty)'}
                        primaryTypographyProps={{
                          variant: 'body2',
                          style: {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          },
                        }}
                      />
                    </ListItemButton>
                  );
                })}
            </List>

            {/* Footer */}
            <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
              <Typography variant="caption" color="text.secondary">
                {columnFilters[activeFilterColumn]?.size || getUniqueColumnValues(activeFilterColumn).length} of {getUniqueColumnValues(activeFilterColumn).length} values selected
              </Typography>
            </Box>
          </Box>
        )}
      </Popover>
    </Box>
  );
};

export default DetailedDataView;
