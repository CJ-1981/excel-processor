import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Paper,
  InputAdornment,
  IconButton,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableSortLabel,
  TablePagination,
  Checkbox,
  Collapse,
  Button,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface UniqueNameListProps {
  data: any[];
  nameColumn: string | null;
  headerRowIndex: number; // Which row contains the actual headers (1-indexed)
  selectedNames: string[]; // Changed from onNameSelect
  onNamesSelect: (names: string[]) => void; // Changed from onNameSelect
}

type Order = 'asc' | 'desc';

interface HeadCell {
  id: string;
  label: string;
  numeric: boolean;
}

const headCells: HeadCell[] = [
  { id: 'name', numeric: false, label: 'Name' },
];

function EnhancedTableHead(props: {
  onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
  order: Order;
  orderBy: string;
  numSelected: number;
  rowCount: number;
  onRequestSort: (event: React.MouseEvent<unknown>, property: string) => void;
}) {
  const { onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort } = props;
  const createSortHandler = (property: string) => (event: React.MouseEvent<unknown>) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
            inputProps={{ 'aria-label': 'select all names' }}
          />
        </TableCell>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            padding="normal"
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

const UniqueNameList: React.FC<UniqueNameListProps> = ({ data, nameColumn, headerRowIndex, selectedNames, onNamesSelect }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<string>('name');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showSelectedExpanded, setShowSelectedExpanded] = useState<boolean>(true); // Expand selected names section

  const uniqueNames = useMemo(() => {
    if (!nameColumn || data.length === 0) return [];

    // Convert headerRowIndex (1-indexed) to array index
    const headerRowIdx = headerRowIndex - 1;

    // Resolve actual column name when placeholder keys (e.g., A, B, __EMPTY) are used.
    // If the key is already human-readable, use it directly.
    let actualColumnName = nameColumn;
    const isPlaceholder = (k: string) => /^[A-Z]+$/.test(k) || /^__EMPTY/.test(k);
    if (isPlaceholder(nameColumn)) {
      if (headerRowIdx >= 0 && headerRowIdx < data.length) {
        const headerRow = data[headerRowIdx];
        const headerValue = headerRow[nameColumn];
        if (headerValue !== undefined && headerValue !== null && headerValue !== '') {
          actualColumnName = String(headerValue);
        }
      }
    }

    // Now extract names using the actual column name from the header row
    // Skip the header row itself when extracting names
    const names = data
      .filter((_, idx) => idx !== headerRowIdx)
      .map(row => {
        // First try the actual column name from header row
        if (actualColumnName in row) {
          return row[actualColumnName];
        }
        // Fall back to the original column key
        return row[nameColumn];
      })
      .filter(Boolean);

    console.log('UniqueNameList Debug:');
    console.log('- Original column key:', nameColumn);
    console.log('- Header row index:', headerRowIndex);
    console.log('- Actual column name from header:', actualColumnName);
    console.log('- Total rows:', data.length);
    console.log('- Names found:', names.slice(0, 10));

    return Array.from(new Set(names));
  }, [data, nameColumn, headerRowIndex]);


  const handleRequestSort = (_event: React.MouseEvent<unknown>, property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Get selected names (sorted)
  const selectedNamesSorted = useMemo(() => {
    const selected = uniqueNames.filter(name => selectedNames.includes(name));
    return [...selected].sort((a, b) => {
      const orderValue = order === 'desc' ? -1 : 1;
      return orderValue * String(a).localeCompare(String(b));
    });
  }, [uniqueNames, selectedNames, order]);

  // Get selected names that match search (sorted)
  const selectedMatchingSearchSorted = useMemo(() => {
    if (!searchTerm) return [];
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return selectedNamesSorted.filter(name =>
      String(name).toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [selectedNamesSorted, searchTerm]);

  // Get unselected names that match search (sorted)
  const unselectedNamesSorted = useMemo(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const unselected = uniqueNames
      .filter(name => !selectedNames.includes(name))
      .filter(name => String(name).toLowerCase().includes(lowerCaseSearchTerm));
    return [...unselected].sort((a, b) => {
      const orderValue = order === 'desc' ? -1 : 1;
      return orderValue * String(a).localeCompare(String(b));
    });
  }, [uniqueNames, selectedNames, searchTerm, order]);

  // Names to display in the table
  const displayedNames = useMemo(() => {
    if (searchTerm) {
      // When searching: show matching selected first, then matching unselected
      return [...selectedMatchingSearchSorted, ...unselectedNamesSorted];
    } else if (showSelectedExpanded) {
      // Not searching, expanded: show all selected at top, then unselected
      return [...selectedNamesSorted, ...uniqueNames.filter(name => !selectedNames.includes(name)).sort((a, b) => {
        const orderValue = order === 'desc' ? -1 : 1;
        return orderValue * String(a).localeCompare(String(b));
      })];
    } else {
      // Not searching, collapsed: show only unselected
      return uniqueNames.filter(name => !selectedNames.includes(name)).sort((a, b) => {
        const orderValue = order === 'desc' ? -1 : 1;
        return orderValue * String(a).localeCompare(String(b));
      });
    }
  }, [selectedNamesSorted, selectedMatchingSearchSorted, unselectedNamesSorted, uniqueNames, selectedNames, showSelectedExpanded, searchTerm, order]);

  // Count of selected names that match search (for info)
  const selectedMatchingSearch = selectedMatchingSearchSorted.length;


  const handleSelectAllClick = (_event: React.ChangeEvent<HTMLInputElement>) => {
    // If any names are selected (partial or full), clicking clears the selection
    // If no names are selected, clicking selects all
    if (selectedNames.length > 0) {
      onNamesSelect([]);
    } else {
      onNamesSelect(displayedNames);
    }
  };

  const handleClick = (_event: React.MouseEvent<unknown>, name: string) => {
    const selectedIndex = selectedNames.indexOf(name);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedNames, name);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedNames.slice(1));
    } else if (selectedIndex === selectedNames.length - 1) {
      newSelected = newSelected.concat(selectedNames.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedNames.slice(0, selectedIndex),
        selectedNames.slice(selectedIndex + 1),
      );
    }
    onNamesSelect(newSelected);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const isSelected = (name: string) => selectedNames.indexOf(name) !== -1;

  // Get all names matching current search
  const allMatchingSearch = useMemo(() => {
    if (!searchTerm) return [];
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return uniqueNames.filter(name =>
      String(name).toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [uniqueNames, searchTerm]);

  // Select all names matching search
  const handleSelectAllSearched = () => {
    const newSelected = new Set(selectedNames);
    allMatchingSearch.forEach(name => newSelected.add(name));
    onNamesSelect(Array.from(newSelected));
  };

  // Deselect all names matching search
  const handleDeselectAllSearched = () => {
    const matchingSet = new Set(allMatchingSearch);
    const newSelected = selectedNames.filter(name => !matchingSet.has(name));
    onNamesSelect(newSelected);
  };

  if (!nameColumn || data.length === 0) {
    return null;
  }

  const paginatedDisplayedNames = rowsPerPage > 0
    ? displayedNames.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : displayedNames;

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - displayedNames.length) : 0;

  return (
    <Box sx={{ mt: 4, width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">Unique Names</Typography>
        <Typography variant="body2" color="text.secondary">
          Found {uniqueNames.length} unique values in "{nameColumn}"
        </Typography>
      </Box>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search names..."
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
              <IconButton onClick={() => setSearchTerm('')} edge="end">
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />

      {/* Selected Names Panel - Collapsible */}
      {selectedNames.length > 0 && (
        <Paper sx={{ p: 1.5, mb: 2, bgcolor: 'action.hover' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            onClick={() => setShowSelectedExpanded(!showSelectedExpanded)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                size="small"
                label={`${selectedNames.length} selected`}
                color="primary"
              />
              {searchTerm && selectedMatchingSearch > 0 && (
                <Typography variant="caption" color="text.secondary">
                  ({selectedMatchingSearch} match search)
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onNamesSelect([]);
                }}
                color="error"
              >
                Clear all
              </Button>
              <IconButton size="small">
                {showSelectedExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
          </Box>

          <Collapse in={showSelectedExpanded}>
            <Box
              sx={{
                mt: 1.5,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.5,
                maxHeight: 150,
                overflowY: 'auto',
              }}
            >
              {selectedNamesSorted.map((name) => (
                <Chip
                  key={name}
                  label={name}
                  size="small"
                  onDelete={() => handleClick({ stopPropagation: () => {} } as any, name)}
                  sx={{
                    maxWidth: 200,
                    '& .MuiChip-label': {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    },
                  }}
                />
              ))}
            </Box>
          </Collapse>
        </Paper>
      )}

      {/* Search Results Info */}
      {searchTerm && (
        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary">
            {displayedNames.length} result{displayedNames.length !== 1 ? 's' : ''} for "{searchTerm}"
          </Typography>
          {selectedMatchingSearch > 0 && (
            <Chip
              size="small"
              label={`${selectedMatchingSearch} selected`}
              color="primary"
              variant="outlined"
            />
          )}
          <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
            <Button
              size="small"
              variant="outlined"
              onClick={handleSelectAllSearched}
              disabled={allMatchingSearch.length === selectedMatchingSearch}
            >
              Select all
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={handleDeselectAllSearched}
              disabled={selectedMatchingSearch === 0}
            >
              Deselect all
            </Button>
          </Box>
        </Box>
      )}

      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table stickyHeader aria-label="unique names table">
            <EnhancedTableHead
              numSelected={selectedNames.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={handleRequestSort}
              rowCount={uniqueNames.length}
            />
            <TableBody>
              {paginatedDisplayedNames.map((name, index) => {
                const isItemSelected = isSelected(name);
                const labelId = `enhanced-table-checkbox-${index}`;

                return (
                  <TableRow
                    hover
                    onClick={(event) => handleClick(event, name)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={name}
                    selected={isItemSelected}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={isItemSelected}
                        inputProps={{ 'aria-labelledby': labelId }}
                      />
                    </TableCell>
                    <TableCell component="th" id={labelId} scope="row" sx={{ minWidth: 150 }}>
                      <Typography noWrap>{name}</Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={headCells.length + 1} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={displayedNames.length} // Use displayedNames.length for count
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default UniqueNameList;
