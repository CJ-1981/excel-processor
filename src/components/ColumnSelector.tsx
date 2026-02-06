import React, { useState, useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box, Typography, ListSubheader } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';

interface ColumnSelectorProps {
  data: any[];
  onColumnSelect: (columnName: string, headerRowIndex: number) => void;
}

interface ColumnOption {
  original: string;
  display: string;
  rowIndex: number;
  value: string; // The actual value in this cell
}

const ColumnSelector: React.FC<ColumnSelectorProps> = ({ data, onColumnSelect }) => {
  const [columns, setColumns] = useState<ColumnOption[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(1);

  useEffect(() => {
    if (data.length > 0) {
      console.log('ColumnSelector - data[0] sample:', data[0]);
      console.log('ColumnSelector - all keys:', Object.keys(data[0]));

      // Get column headers from the data structure
      const rawHeaders = Object.keys(data[0]);
      const rowsToScan = Math.min(3, data.length);
      const allColumns: ColumnOption[] = [];

      console.log('ColumnSelector - rawHeaders:', rawHeaders);

      // For each column, show the value from each of the first 3 rows
      // Skip source metadata columns
      rawHeaders.forEach((header) => {
        // Skip metadata columns
        if (header === '_sourceFileName' || header === '_sourceSheetName') {
          return;
        }
        for (let rowIdx = 0; rowIdx < rowsToScan; rowIdx++) {
          const row = data[rowIdx];
          const value = row[header];
          const valueStr = value !== undefined && value !== null && value !== '' ? String(value) : '(empty)';

          let display = header;
          // Convert __EMPTY_X headers to Excel column letters
          if (header.startsWith('__EMPTY_')) {
            let colIdx = parseInt(header.replace('__EMPTY_', ''), 10);
            if (isNaN(colIdx)) {
              colIdx = rawHeaders.indexOf(header);
            }
            let colLetter = '';
            let temp = colIdx + 1;
            while (temp > 0) {
              colLetter = String.fromCharCode(65 + (temp - 1) % 26) + colLetter;
              temp = Math.floor((temp - 1) / 26);
            }
            display = colLetter || header;
          }

          allColumns.push({
            original: header,
            display: `${display}: "${valueStr}"`,
            rowIndex: rowIdx + 1,
            value: valueStr
          });
        }
      });

      setColumns(allColumns);
      console.log('ColumnSelector - allColumns built:', allColumns.length, 'options');

      // Auto-select first column with non-empty value from first row
      const firstNonEmpty = allColumns.find(col => col.rowIndex === 1 && col.value !== '(empty)');
      if (firstNonEmpty) {
        console.log('ColumnSelector - auto-selecting:', firstNonEmpty);
        setSelectedColumn(firstNonEmpty.original);
        setSelectedRowIndex(firstNonEmpty.rowIndex);
        onColumnSelect(firstNonEmpty.original, firstNonEmpty.rowIndex);
      } else if (allColumns.length > 0) {
        console.log('ColumnSelector - selecting first available:', allColumns[0]);
        setSelectedColumn(allColumns[0].original);
        setSelectedRowIndex(allColumns[0].rowIndex);
        onColumnSelect(allColumns[0].original, allColumns[0].rowIndex);
      } else {
        console.log('ColumnSelector - no columns to select!');
      }
    }
  }, [data, onColumnSelect]);

  const handleChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value as string;
    // Parse the value which is in format "rowIndex-originalColumnName"
    const [rowIndexStr, originalColumnName] = value.split('-');
    const rowIndex = parseInt(rowIndexStr, 10);

    // Find the column with this original name and row index
    const selectedCol = columns.find(col => col.original === originalColumnName && col.rowIndex === rowIndex);
    if (selectedCol) {
      console.log('ColumnSelector - user selected:', selectedCol);
      setSelectedColumn(originalColumnName);
      setSelectedRowIndex(rowIndex);
      onColumnSelect(originalColumnName, rowIndex);
    }
  };

  // Group columns by row
  const groupedColumns = columns.reduce((acc, column) => {
    if (!acc[column.rowIndex]) {
      acc[column.rowIndex] = [];
    }
    acc[column.rowIndex].push(column);
    return acc;
  }, {} as Record<number, ColumnOption[]>);

  console.log('ColumnSelector - groupedColumns:', Object.keys(groupedColumns));
  console.log('ColumnSelector - selectedColumn value:', selectedColumn);

  if (data.length === 0) {
    return null;
  }

  if (columns.length === 0) {
    console.log('ColumnSelector - no columns available!');
    return null;
  }

  return (
    <Box sx={{ mt: 3, width: '100%' }}>
      <Typography variant="h6" gutterBottom>Select Column for Names</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Showing values from first 3 rows to identify header row
      </Typography>
      <FormControl fullWidth>
        <InputLabel id="column-select-label">Select Name Column</InputLabel>
        <Select
          labelId="column-select-label"
          id="column-select"
          value={selectedRowIndex ? `${selectedRowIndex}-${selectedColumn}` : ''}
          label="Select Name Column"
          onChange={handleChange}
          MenuProps={{
            PaperProps: {
              sx: {
                maxHeight: 600,
              }
            }
          }}
        >
          {Object.entries(groupedColumns).flatMap(([rowNum, cols]) => [
            <ListSubheader key={`header-${rowNum}`} sx={{ bgcolor: 'grey.100', fontWeight: 'bold' }}>
              Row {rowNum}
            </ListSubheader>,
            ...cols.map((column) => (
              <MenuItem key={`${column.rowIndex}-${column.original}`} value={`${column.rowIndex}-${column.original}`}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="body2" sx={{ fontWeight: column.value !== '(empty)' ? 'bold' : 'normal' }}>
                    {column.display}
                  </Typography>
                </Box>
              </MenuItem>
            ))
          ])}
        </Select>
      </FormControl>
    </Box>
  );
};

export default ColumnSelector;

