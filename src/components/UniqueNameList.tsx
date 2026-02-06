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
  Divider // Add Divider here
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

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

  const uniqueNames = useMemo(() => {
    if (!nameColumn || data.length === 0) return [];

    // Convert headerRowIndex (1-indexed) to array index
    const headerRowIdx = headerRowIndex - 1;

    // The nameColumn is the original key (e.g., "__EMPTY_0")
    // But we need to find what value is at that position in the header row
    // and use that as the actual column name for lookups
    let actualColumnName = nameColumn;

    if (headerRowIdx >= 0 && headerRowIdx < data.length) {
      const headerRow = data[headerRowIdx];
      // Get the value from the header row at this column position
      const headerValue = headerRow[nameColumn];
      if (headerValue !== undefined && headerValue !== null && headerValue !== '') {
        actualColumnName = String(headerValue);
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

  const displayedNames = useMemo(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    // 1. Get all selected names from the original unique list
    // These should always be displayed regardless of search term
    const currentlySelectedNames = uniqueNames.filter(name => selectedNames.includes(name));

    // 2. Filter the *unselected* names based on the search term
    const unselectedAndFilteredNames = uniqueNames
      .filter(name => !selectedNames.includes(name)) // Exclude already selected names
      .filter(name => String(name).toLowerCase().includes(lowerCaseSearchTerm)); // Apply search term

    // Keep selected names at top while maintaining sort order within each group
    // Clone arrays before sorting to avoid mutation
    const selectedSorted = [...currentlySelectedNames].sort((a, b) => {
      const orderValue = order === 'desc' ? -1 : 1;
      return orderValue * String(a).localeCompare(String(b));
    });

    const unselectedSorted = [...unselectedAndFilteredNames].sort((a, b) => {
      const orderValue = order === 'desc' ? -1 : 1;
      return orderValue * String(a).localeCompare(String(b));
    });

    return [...selectedSorted, ...unselectedSorted];
  }, [uniqueNames, selectedNames, searchTerm, order]);


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
      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table stickyHeader aria-label="unique names table">
            <EnhancedTableHead
              numSelected={selectedNames.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={handleRequestSort}
              rowCount={displayedNames.length} // Use displayedNames.length for rowCount
            />
            <TableBody>
              {paginatedDisplayedNames.map((name, index) => {
                const isItemSelected = isSelected(name);
                const labelId = `enhanced-table-checkbox-${index}`;
                
                // Determine if this is the first unselected item in the displayed list
                const numSelectedAndDisplayed = displayedNames.filter(n => selectedNames.includes(n)).length;
                const isFirstUnselected = index === numSelectedAndDisplayed && numSelectedAndDisplayed > 0 && displayedNames.length > numSelectedAndDisplayed;

                return (
                  <React.Fragment key={name}>
                    {isFirstUnselected && (
                      <TableRow>
                        <TableCell colSpan={headCells.length + 1} sx={{ borderBottom: 'none', p: 0 }}>
                          <Divider sx={{ my: 1, mx: 2 }} />
                        </TableCell>
                      </TableRow>
                    )}
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
                  </React.Fragment>
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
