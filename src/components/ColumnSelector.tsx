import React, { useState, useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box, Typography, ListSubheader } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';

interface ColumnSelectorProps {
  data: any[];
  onColumnSelect: (columnName: string) => void;
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

  useEffect(() => {
    if (data.length > 0) {
      // Get column headers from the data structure
      const rawHeaders = Object.keys(data[0]);
      const rowsToScan = Math.min(3, data.length);
      const allColumns: ColumnOption[] = [];

      // For each column, show the value from each of the first 3 rows
      rawHeaders.forEach((header) => {
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

      // Auto-select first column with non-empty value from first row
      const firstNonEmpty = allColumns.find(col => col.rowIndex === 1 && col.value !== '(empty)');
      if (firstNonEmpty) {
        setSelectedColumn(firstNonEmpty.original);
        onColumnSelect(firstNonEmpty.original);
      } else if (allColumns.length > 0) {
        setSelectedColumn(allColumns[0].original);
        onColumnSelect(allColumns[0].original);
      }
    }
  }, [data, onColumnSelect]);

  const handleChange = (event: SelectChangeEvent<string>) => {
    const originalColumnName = event.target.value as string;
    setSelectedColumn(originalColumnName);
    onColumnSelect(originalColumnName);
  };

  // Group columns by row
  const groupedColumns = columns.reduce((acc, column) => {
    if (!acc[column.rowIndex]) {
      acc[column.rowIndex] = [];
    }
    acc[column.rowIndex].push(column);
    return acc;
  }, {} as Record<number, ColumnOption[]>);

  if (data.length === 0) {
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
          value={selectedColumn}
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
          {Object.entries(groupedColumns).map(([rowNum, cols]) => (
            <div key={rowNum}>
              <ListSubheader sx={{ bgcolor: 'grey.100', fontWeight: 'bold' }}>
                Row {rowNum}
              </ListSubheader>
              {cols.map((column) => (
                <MenuItem key={`${column.rowIndex}-${column.original}`} value={column.original}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="body2" sx={{ fontWeight: column.value !== '(empty)' ? 'bold' : 'normal' }}>
                      {column.display}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </div>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default ColumnSelector;

