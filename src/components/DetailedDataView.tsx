import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, Button,
  TableSortLabel, TextField, InputAdornment, IconButton, TablePagination, Menu, MenuItem, FormControlLabel, Checkbox, Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FullscreenIcon from '@mui/icons-material/Fullscreen'; // Import FullscreenIcon
import ViewColumnIcon from '@mui/icons-material/ViewColumn'; // Import ViewColumnIcon
import * as XLSX from 'xlsx';

interface DetailedDataViewProps {
  data: any[];
  nameColumn: string | null;
  selectedUniqueNames: string[];
  onToggleFullScreen: () => void; // New prop
  isFullScreen: boolean; // New prop
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


const DetailedDataView: React.FC<DetailedDataViewProps> = ({ data, nameColumn, selectedUniqueNames, onToggleFullScreen, isFullScreen, columnVisibility, setColumnVisibility }) => {
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null); // For column selection menu

  const filteredData = useMemo(() => {
    if (!nameColumn || selectedUniqueNames.length === 0 || data.length === 0) {
      return [];
    }
    return data.filter(row => selectedUniqueNames.includes(row[nameColumn]));
  }, [data, nameColumn, selectedUniqueNames]);


  const allAvailableHeaders = useMemo(() => {
    if (filteredData.length === 0) return [];
    const keys = Object.keys(filteredData[0]);
    const dynamicHeaders: HeadCell[] = [];

    if (keys.includes('_sourceFileName')) {
      dynamicHeaders.push({ id: '_sourceFileName', label: 'Source File', numeric: false });
      dynamicHeaders.push({ id: '_sourceSheetName', label: 'Source Sheet', numeric: false });
    }

    keys.filter(key => key !== '_sourceFileName' && key !== '_sourceSheetName')
        .forEach(key => dynamicHeaders.push({ id: key, label: key, numeric: typeof filteredData[0][key] === 'number' }));
    
    return dynamicHeaders;
  }, [filteredData]);

  // Initialize column visibility when headers change (only if not already set)
  useEffect(() => {
    if (allAvailableHeaders.length > 0 && Object.keys(columnVisibility).length === 0) {
      const initialVisibility: Record<string, boolean> = {};
      allAvailableHeaders.forEach(header => {
        initialVisibility[header.id] = true; // All columns visible by default
      });
      setColumnVisibility(initialVisibility);
    }
  }, [allAvailableHeaders, columnVisibility]);


  // Headers that are currently visible
  const visibleHeaders = useMemo(() => {
    return allAvailableHeaders.filter(header => columnVisibility[header.id]);
  }, [allAvailableHeaders, columnVisibility]);


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
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(lowerCaseSearchTerm)
        )
      );
    }

    // Apply sorting
    if (orderBy) {
      currentData = stableSort(currentData, getComparator(order, orderBy));
    }

    return currentData;
  }, [filteredData, searchTerm, order, orderBy]);

  // Calculate column totals
  const columnTotals = useMemo(() => {
    const totals: { [key: string]: number | string } = {};
    visibleHeaders.forEach(header => { // Use visibleHeaders for totals
      let sum = 0;
      let isNumericColumn = true;
      filteredAndSortedData.forEach(row => {
        const value = row[header.id];
        const numValue = parseFloat(String(value)); // Ensure value is string before parseFloat
        if (isNaN(numValue) || typeof value === 'boolean') { // Treat boolean as non-numeric for sum
          isNumericColumn = false;
        } else {
          sum += numValue;
        }
      });
      totals[header.id] = isNumericColumn ? sum : '';
    });
    return totals;
  }, [filteredAndSortedData, visibleHeaders]);


  const handleExportCsv = () => {
    if (filteredAndSortedData.length > 0) {
      const dataToExport = filteredAndSortedData.map(row => {
        const newRow: { [key: string]: any } = {};
        visibleHeaders.forEach(header => {
            newRow[header.label] = row[header.id]; // Export visible columns with their labels
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
                maxHeight: 600, // Show at least 12-15 column options
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
            {allAvailableHeaders.map((header) => (
              <MenuItem key={header.id} dense>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={columnVisibility[header.id]}
                      onChange={() => handleToggleColumnVisibility(header.id)}
                      size="small"
                    />
                  }
                  label={header.label}
                />
              </MenuItem>
            ))}
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
          sx={{ width: '40%' }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleExportCsv}
          disabled={filteredAndSortedData.length === 0}
        >
          Export as CSV
        </Button>
      </Box>
      <TableContainer component={Paper} sx={{ flexGrow: 1, overflow: 'auto' }}>
        <Table stickyHeader aria-label="detailed data table">
          <TableHead>
            <TableRow>
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
            {paginatedData.map((row, index) => (
              <TableRow hover key={index}>
                {visibleHeaders.map((headCell, cellIndex) => {
                  const cellValue = row[headCell.id];
                  return (
                    <TableCell key={`${index}-${headCell.id}`} sx={{ borderRight: cellIndex < visibleHeaders.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                      {cellValue !== undefined && cellValue !== null ? String(cellValue) : ''}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
            {emptyRows > 0 && (
              <TableRow style={{ height: (33) * emptyRows }}> {/* Adjusted height for dense table */}
                <TableCell colSpan={visibleHeaders.length} sx={{ borderRight: 0 }} />
              </TableRow>
            )}
            {/* Summary Row */}
            <TableRow sx={{ '& > td': { fontWeight: 'bold' } }}>
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
    </Box>
  );
};

export default DetailedDataView;
