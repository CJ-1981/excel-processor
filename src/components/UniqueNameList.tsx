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
import { alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useTranslation } from 'react-i18next';
import { debug } from '../utils/logger';

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

// Default headCells (will be overridden by translations)
const defaultHeadCells: HeadCell[] = [
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
      <TableRow sx={{ bgcolor: 'surface' }}>
        <TableCell padding="checkbox" sx={{ bgcolor: 'surface', borderBottom: '1px solid', borderColor: 'hairline' }}>
          <Checkbox
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
            inputProps={{ 'aria-label': 'select all names' }}
            sx={(theme) => ({
              color: theme.palette.mode === 'dark' ? '#a5d6a7' : '#8d6e63',
              '&.Mui-checked': {
                color: theme.palette.mode === 'dark' ? '#4caf50' : '#2e7d32',
              },
              '&.MuiCheckbox-indeterminate': {
                color: theme.palette.mode === 'dark' ? '#4caf50' : '#2e7d32',
              },
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(76, 175, 80, 0.08)'
                  : 'rgba(46, 125, 50, 0.08)',
              },
              '&.Mui-checked:hover': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(76, 175, 80, 0.16)'
                  : 'rgba(46, 125, 50, 0.16)',
              },
            })}
          />
        </TableCell>
        {defaultHeadCells.map((headCell: HeadCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            padding="normal"
            sortDirection={orderBy === headCell.id ? order : false}
            sx={{ 
              bgcolor: 'surface', 
              fontWeight: 600, 
              color: 'text.primary',
              borderBottom: '1px solid',
              borderColor: 'hairline'
            }}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
              sx={(theme) => ({
                '&.Mui-active': {
                  color: theme.palette.mode === 'light' ? '#2e7d32' : '#4caf50',
                },
                '& .MuiTableSortLabel-icon': {
                  color: `${theme.palette.mode === 'light' ? '#2e7d32' : '#4caf50'} !important`,
                },
              })}
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
  const { t } = useTranslation();

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

    debug('UniqueNameList', 'Debug:');
    debug('UniqueNameList', '- Original column key:', nameColumn);
    debug('UniqueNameList', '- Header row index:', headerRowIndex);
    debug('UniqueNameList', '- Actual column name from header:', actualColumnName);
    debug('UniqueNameList', '- Total rows:', data.length);
    debug('UniqueNameList', '- Names found:', names.slice(0, 10));

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
        <Typography variant="h6">{t('uniqueNames.title')}</Typography>
        <Typography variant="body2" color="text.secondary">
          {t('uniqueNames.found', { count: uniqueNames.length, column: nameColumn })}
        </Typography>
      </Box>
      <TextField
        fullWidth
        variant="outlined"
        placeholder={t('uniqueNames.searchPlaceholder')}
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setPage(0); // Reset page on search
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: 'steel' }} />
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
        sx={{ 
          mb: 3,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2, // rounded.md (8px)
            height: 44,
            bgcolor: 'surface',
            '& fieldset': {
              borderColor: 'hairlineStrong',
            },
            '&:hover fieldset': {
              borderColor: 'primary.main',
            },
            '&.Mui-focused fieldset': {
              borderWidth: '2px',
              borderColor: 'primary.dark',
            },
          }
        }}
      />

      {/* Selected Names Panel - Collapsible */}
      {selectedNames.length > 0 && (
        <Paper 
          elevation={0}
          sx={{ 
            p: 2, 
            mb: 3, 
            bgcolor: 'surfaceFeature', 
            border: '1px solid',
            borderColor: 'primary.main',
            borderRadius: 1
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            onClick={() => setShowSelectedExpanded(!showSelectedExpanded)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Chip
                size="small"
                label={`${selectedNames.length} ${t('uniqueNames.selected')}`}
                sx={{ 
                  bgcolor: 'secondary.main', 
                  color: 'white',
                  fontWeight: 600
                }}
              />
              {searchTerm && selectedMatchingSearch > 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  ({t('uniqueNames.matchSearch', { count: selectedMatchingSearch })})
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                size="small"
                variant="text"
                onClick={(e) => {
                  e.stopPropagation();
                  onNamesSelect([]);
                }}
                sx={{ color: 'error.main', fontWeight: 600 }}
              >
                {t('uniqueNames.clearAll')}
              </Button>
              <IconButton size="small">
                {showSelectedExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
          </Box>

          <Collapse in={showSelectedExpanded}>
            <Box
              sx={{
                mt: 2,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                maxHeight: 200,
                overflowY: 'auto',
                p: 0.5
              }}
            >
              {selectedNamesSorted.map((name, idx) => {
                // Cycle through category colors for a colorful look
                const categoryColors = ['#7E57C2', '#FF7043', '#00684A', '#42A5F5', '#EC407A'];
                const color = categoryColors[idx % categoryColors.length];

                return (
                  <Chip
                    key={name}
                    label={name}
                    size="medium"
                    onDelete={() => handleClick({ stopPropagation: () => {} } as any, name)}
                    sx={(theme) => ({
                      maxWidth: 250,
                      bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff',
                      px: 0.5,
                      borderRadius: 9999, // Pill shape
                      border: '1px solid',
                      borderColor: theme.palette.mode === 'light' ? '#e0e0e0' : '#404040',
                      boxShadow: theme.palette.mode === 'light' ? '0px 1px 3px rgba(0, 30, 43, 0.08)' : 'none',
                      '& .MuiChip-label': {
                        fontWeight: 600,
                        color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#1f2937',
                        pl: 2
                      },
                      '& .MuiChip-deleteIcon': {
                        color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
                        '&:hover': { color: theme.palette.mode === 'dark' ? '#ef4444' : '#dc2626' }
                      },
                      '&::before': {
                        content: '""',
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: color,
                        ml: 1.5,
                        flexShrink: 0
                      },
                      '&:hover': {
                        bgcolor: (theme) => theme.palette.mode === 'light' ? '#f5f7f7' : alpha('#FFFFFF', 0.05),
                        borderColor: color
                      }
                    })}
                  />
                );
              })}
            </Box>
          </Collapse>
        </Paper>
      )}

      {/* Search Results Info */}
      {searchTerm && (
        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary">
            {t('uniqueNames.searchResults', { count: displayedNames.length, term: searchTerm })}
          </Typography>
          {selectedMatchingSearch > 0 && (
            <Chip
              size="small"
              label={`${selectedMatchingSearch} ${t('uniqueNames.selected')}`}
              sx={(theme) => ({
                bgcolor: theme.palette.mode === 'dark' ? '#1b5e20' : '#e8f5e9',
                color: theme.palette.mode === 'dark' ? '#ffffff' : '#1b5e20',
                border: theme.palette.mode === 'dark' ? '2px solid #4caf50' : '1px solid #2e7d32',
                fontWeight: 700,
                fontSize: '0.813rem',
                height: 26,
              })}
            />
          )}
          <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
            <Button
              size="small"
              variant="outlined"
              onClick={handleSelectAllSearched}
              disabled={allMatchingSearch.length === selectedMatchingSearch}
            >
              {t('uniqueNames.selectAll')}
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={handleDeselectAllSearched}
              disabled={selectedMatchingSearch === 0}
            >
              {t('uniqueNames.deselectAll')}
            </Button>
          </Box>
        </Box>
      )}

      <Paper 
        elevation={0} 
        sx={{ 
          width: '100%', 
          mb: 2, 
          borderRadius: 2, 
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'hairline'
        }}
      >
        <TableContainer sx={{ maxHeight: 600 }}>
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
                    sx={{ 
                      cursor: 'pointer',
                      '&.Mui-selected': {
                        bgcolor: alpha('#00ED64', 0.08),
                        '&:hover': {
                          bgcolor: alpha('#00ED64', 0.12),
                        }
                      }
                    }}
                  >
                    <TableCell padding="checkbox" sx={{ borderBottom: '1px solid', borderColor: 'hairlineSoft' }}>
                      <Checkbox
                        checked={isItemSelected}
                        slotProps={{ input: { 'aria-labelledby': labelId } }}
                        sx={(theme) => ({
                          color: theme.palette.mode === 'dark' ? '#a5d6a7' : '#8d6e63',
                          '&.Mui-checked': {
                            color: theme.palette.mode === 'dark' ? '#4caf50' : '#2e7d32',
                          },
                          '&:hover': {
                            backgroundColor: theme.palette.mode === 'dark'
                              ? 'rgba(76, 175, 80, 0.08)'
                              : 'rgba(46, 125, 50, 0.08)',
                          },
                          '&.Mui-checked:hover': {
                            backgroundColor: theme.palette.mode === 'dark'
                              ? 'rgba(76, 175, 80, 0.16)'
                              : 'rgba(46, 125, 50, 0.16)',
                          },
                        })}
                      />
                    </TableCell>
                    <TableCell 
                      component="th" 
                      id={labelId} 
                      scope="row" 
                      sx={{ 
                        minWidth: 150,
                        borderBottom: '1px solid',
                        borderColor: 'hairlineSoft'
                      }}
                    >
                      <Typography noWrap sx={{ fontWeight: isItemSelected ? 600 : 400 }}>
                        {name}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={2} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={displayedNames.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: '1px solid', borderColor: 'hairline' }}
        />
      </Paper>
    </Box>
  );
};

export default UniqueNameList;
