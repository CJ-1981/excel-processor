import React, { useState, useEffect, useMemo } from 'react';
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

const UniqueNameList: React.FC<UniqueNameListProps> = ({ data, nameColumn, selectedNames, onNamesSelect }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<string>('name');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const uniqueNames = useMemo(() => {
    if (!nameColumn || data.length === 0) return [];
    const names = data.map(row => row[nameColumn]).filter(Boolean);
    return Array.from(new Set(names));
  }, [data, nameColumn]);

  useEffect(() => {
    // Clear selection if the underlying data changes
    onNamesSelect([]);
  }, [uniqueNames]);


  const handleRequestSort = (event: React.MouseEvent<unknown>, property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedNames = useMemo(() => {
    const stabilizedThis = uniqueNames.map((el, index) => [el, index] as [any, number]);
    stabilizedThis.sort((a, b) => {
      const orderValue = order === 'desc' ? -1 : 1;
      return orderValue * String(a[0]).localeCompare(String(b[0]));
    });
    return stabilizedThis.map((el) => el[0]);
  }, [uniqueNames, order, orderBy]);

  const displayedNames = useMemo(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    // 1. Get all selected names from the original unique list
    // These should always be displayed regardless of search term
    const currentlySelectedNames = uniqueNames.filter(name => selectedNames.includes(name));

    // 2. Filter the *unselected* names based on the search term
    const unselectedAndFilteredNames = uniqueNames
      .filter(name => !selectedNames.includes(name)) // Exclude already selected names
      .filter(name => String(name).toLowerCase().includes(lowerCaseSearchTerm)); // Apply search term

    // 3. Combine them: selected first, then filtered unselected
    return [...currentlySelectedNames, ...unselectedAndFilteredNames];
  }, [uniqueNames, selectedNames, searchTerm]);


  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      onNamesSelect(displayedNames); // Select all currently displayed
      return;
    }
    onNamesSelect([]);
  };

  const handleClick = (event: React.MouseEvent<unknown>, name: string) => {
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

  const handleChangePage = (event: unknown, newPage: number) => {
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
      <Typography variant="h6" gutterBottom>Unique Names</Typography>
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
