import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, Button,
  TableSortLabel, TextField, InputAdornment, IconButton, TablePagination, Menu, MenuItem, FormControlLabel, Checkbox, Divider, Switch, FormGroup
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import * as XLSX from 'xlsx';
import { PDFExportDialog } from './PDFExport';
import type { PDFGenerationContext } from '../types';

interface DetailedDataViewProps {
  data: any[];
  nameColumn: string | null;
  headerRowIndex: number; // Which row contains the actual headers (1-indexed)
  selectedUniqueNames: string[];
  onToggleFullScreen: () => void;
  isFullScreen: boolean;
  columnVisibility: Record<string, boolean>;
  setColumnVisibility: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
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

function getComparator<Key extends keyof any>(
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


const DetailedDataView: React.FC<DetailedDataViewProps> = ({ data, nameColumn, headerRowIndex, selectedUniqueNames, onToggleFullScreen, isFullScreen, columnVisibility, setColumnVisibility }) => {
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
    if (data.length === 0) return {};
    const headerRowIdx = headerRowIndex - 1;
    console.log('DetailedDataView - headerRowIndex:', headerRowIndex, 'headerRowIdx:', headerRowIdx);
    if (headerRowIdx < 0 || headerRowIdx >= data.length) return {};

    const headerRow = data[headerRowIdx];
    console.log('DetailedDataView - headerRow sample:', headerRow);
    const mapping: Record<string, string> = {};

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
  }, [data, headerRowIndex]);

  const filteredData = useMemo(() => {
    if (!nameColumn || selectedUniqueNames.length === 0 || data.length === 0) {
      return [];
    }
    const headerRowIdx = headerRowIndex - 1;

    return data
      .filter((_, idx) => idx !== headerRowIdx) // Exclude header row
      .filter(row => {
        const value = getRowValue(row, nameColumn, getActualColumnName);
        return selectedUniqueNames.includes(value);
      });
  }, [data, nameColumn, headerRowIndex, selectedUniqueNames, getActualColumnName]);


  const allAvailableHeaders = useMemo(() => {
    if (filteredData.length === 0) return [];
    const keys = Object.keys(filteredData[0]);
    const dynamicHeaders: HeadCell[] = [];

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


  // Headers that are currently visible
  const visibleHeaders = useMemo(() => {
    return allAvailableHeaders.filter(header => columnVisibility[header.id]);
  }, [allAvailableHeaders, columnVisibility]);

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

  const filteredAndSortedData = useMemo(() => {
    let currentData = filteredData;

    // Apply search filter
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      currentData = currentData.filter(row =>
        Object.keys(row).some(key => {
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
  }, [filteredData, searchTerm, order, orderBy, columnMapping]);

  // Initialize all rows as included when data changes
  useEffect(() => {
    if (filteredAndSortedData.length === 0) {
      setIncludedRowIndices(new Set());
      return;
    }

    // Helper function to check if a string is purely numeric (no extra characters)
    const isPureNumericString = (str: string): boolean => {
      // Allow optional sign, digits, decimal point, and optional exponent
      // But no other characters (like Korean text)
      return /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(str.trim());
    };

    // Helper function to check if a row has no valid numeric values in visible columns
    const hasNoValidNumericValues = (row: any): boolean => {
      const visibleColumnIds = new Set(visibleHeaders.map(h => h.id));

      for (const [key, value] of Object.entries(row)) {
        // Skip non-visible columns and source metadata columns
        if (!visibleColumnIds.has(key)) continue;
        if (key === '_sourceFileName' || key === '_sourceSheetName') continue;

        // Skip null, undefined, empty string, or boolean values
        if (value === null || value === undefined || value === '' || typeof value === 'boolean') {
          continue;
        }

        // Check if it's a number type
        if (typeof value === 'number') {
          // Check if this is a valid, non-zero numeric value
          if (value !== 0) {
            return false;
          }
          // If it's zero, continue checking other columns
          continue;
        }

        // If it's a string, check if it's purely numeric
        if (typeof value === 'string') {
          const trimmedValue = value.trim();
          if (isPureNumericString(trimmedValue)) {
            const numValue = parseFloat(trimmedValue);
            // Check if this is a valid, non-zero numeric value
            if (!isNaN(numValue) && numValue !== 0) {
              return false;
            }
          }
          // Not a pure numeric string (contains text), skip it
          continue;
        }
      }

      // No valid non-zero numeric values found in visible columns
      return true;
    };

    // Select all rows, excluding rows without valid numeric values if toggle is ON
    const newSet = new Set<number>();
    filteredAndSortedData.forEach((row, index) => {
      if (autoDeselectZeros && hasNoValidNumericValues(row)) {
        // Don't include rows without valid numeric values
        return;
      }
      newSet.add(index);
    });

    setIncludedRowIndices(newSet);
  }, [filteredAndSortedData, autoDeselectZeros, visibleHeaders, nameColumn]);

  // Calculate column totals (only for included rows)
  const columnTotals = useMemo(() => {
    const totals: { [key: string]: number | string } = {};
    visibleHeaders.forEach(header => {
      let sum = 0;
      let isNumericColumn = true;
      filteredAndSortedData.forEach((row, index) => {
        // Skip non-included rows
        if (!includedRowIndices.has(index)) return;

        let value;
        if (header.id === '_sourceFileName' || header.id === '_sourceSheetName') {
          value = row[header.id];
        } else {
          const actualName = columnMapping[header.id] || header.id;
          value = getRowValue(row, header.id, actualName);
        }
        const numValue = parseFloat(String(value));
        if (isNaN(numValue) || typeof value === 'boolean') {
          isNumericColumn = false;
        } else {
          sum += numValue;
        }
      });
      totals[header.id] = isNumericColumn ? sum : '';
    });
    return totals;
  }, [filteredAndSortedData, visibleHeaders, columnMapping, includedRowIndices]);


  const handleExportCsv = () => {
    if (filteredAndSortedData.length > 0) {
      // Only export included rows
      const dataToExport = filteredAndSortedData
        .filter((_, index) => includedRowIndices.has(index))
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
    sourceFiles: Array.from(new Set(filteredAndSortedData.map(row => row._sourceFileName).filter(Boolean))),
    sourceSheets: Array.from(new Set(filteredAndSortedData.map(row => row._sourceSheetName).filter(Boolean))),
  });

  const handleToggleRowInclude = (index: number) => {
    setIncludedRowIndices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
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
        if (key === '_sourceFileName' || key === '_sourceSheetName') continue;
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

    // Select all rows, excluding rows without valid numeric values if toggle is ON
    const newSet = new Set<number>();
    filteredAndSortedData.forEach((row, index) => {
      if (autoDeselectZeros && hasNoValidNumericValues(row)) {
        return;
      }
      newSet.add(index);
    });

    setIncludedRowIndices(newSet);
  };

  const handleDeselectAllRows = () => {
    setIncludedRowIndices(new Set());
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

  const allColumnsSelected = allAvailableHeaders.length > 0 &&
    allAvailableHeaders.every(header => columnVisibility[header.id]);


  if (selectedUniqueNames.length === 0 || data.length === 0) {
    return null;
  }

  const paginatedData = rowsPerPage > 0
    ? filteredAndSortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : filteredAndSortedData;

  const emptyRows = rowsPerPage - Math.min(rowsPerPage, filteredAndSortedData.length - page * rowsPerPage);

  return (
    <Box sx={{ mt: isFullScreen ? 0 : 4, width: '100%', height: isFullScreen ? '100%' : 'auto', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" gutterBottom={!isFullScreen}>
          Details for: <strong>{selectedUniqueNames.join(', ')}</strong>
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
                                label={header.label}
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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
          sx={{ width: '30%' }}
        />
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
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
              label="Auto-deselect empty/zero-value rows"
              sx={{ mr: 1 }}
            />
          </FormGroup>
          <Button
            variant="outlined"
            size="small"
            onClick={handleSelectAllRows}
            disabled={filteredAndSortedData.length === 0}
          >
            Select All
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={handleDeselectAllRows}
            disabled={includedRowIndices.size === 0}
          >
            Deselect All
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleExportCsv}
            disabled={includedRowIndices.size === 0}
          >
            Export as CSV ({includedRowIndices.size})
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setShowPDFDialog(true)}
            disabled={includedRowIndices.size === 0}
            startIcon={<PictureAsPdfIcon />}
          >
            PDF ({includedRowIndices.size})
          </Button>
        </Box>
      </Box>
      <TableContainer component={Paper} sx={{ flexGrow: 1, overflow: 'auto' }}>
        <Table stickyHeader aria-label="detailed data table">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={includedRowIndices.size > 0 && includedRowIndices.size < filteredAndSortedData.length}
                  checked={includedRowIndices.size === filteredAndSortedData.length && filteredAndSortedData.length > 0}
                  onChange={() => includedRowIndices.size === filteredAndSortedData.length ? handleDeselectAllRows() : handleSelectAllRows()}
                  inputProps={{ 'aria-label': 'select all rows' }}
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
                  <TableSortLabel
                    active={orderBy === headCell.id}
                    direction={orderBy === headCell.id ? order : 'asc'}
                    onClick={(event) => handleRequestSort(event, headCell.id)}
                  >
                    {headCell.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((row, index) => {
              const actualIndex = page * rowsPerPage + index;
              const isIncluded = includedRowIndices.has(actualIndex);
              return (<TableRow hover key={index} sx={{ opacity: isIncluded ? 1 : 0.5 }}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isIncluded}
                      onChange={() => handleToggleRowInclude(actualIndex)}
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
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
        component="div"
        count={filteredAndSortedData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
      <PDFExportDialog
        open={showPDFDialog}
        onClose={() => setShowPDFDialog(false)}
        context={preparePDFContext()}
      />
    </Box>
  );
};

export default DetailedDataView;
