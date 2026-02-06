import React, { useState, useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box, Typography } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';

interface ColumnSelectorProps {
  data: any[];
  onColumnSelect: (columnName: string) => void;
}

const ColumnSelector: React.FC<ColumnSelectorProps> = ({ data, onColumnSelect }) => {
  const [columns, setColumns] = useState<Array<{ original: string; display: string }>>([]);
  const [selectedColumn, setSelectedColumn] = useState<string>('');

  useEffect(() => {
    if (data.length > 0) {
      const rawHeaders = Object.keys(data[0]);
      const processedHeaders = rawHeaders.map((header, index) => {
        if (header.startsWith('__EMPTY_')) {
          // Convert index to Excel column letter (0 -> A, 1 -> B, etc.)
          let colIdx = parseInt(header.replace('__EMPTY_', ''), 10);
          if (isNaN(colIdx)) { // Handle __EMPTY case where index is 0
            colIdx = index;
          }
          let colLetter = '';
          let temp = colIdx + 1; // 1-based index
          while (temp > 0) {
            colLetter = String.fromCharCode(65 + (temp - 1) % 26) + colLetter;
            temp = Math.floor((temp - 1) / 26);
          }
          return { original: header, display: colLetter || header };
        }
        return { original: header, display: header };
      });
      setColumns(processedHeaders);

      if (processedHeaders.length > 0) {
        setSelectedColumn(processedHeaders[0].original); // Select the first original column name
        onColumnSelect(processedHeaders[0].original);
      }
    }
  }, [data]);

  const handleChange = (event: SelectChangeEvent<string>) => {
    const originalColumnName = event.target.value as string;
    setSelectedColumn(originalColumnName);
    onColumnSelect(originalColumnName);
  };

  if (data.length === 0) {
    return null; // Or some loading indicator
  }

  return (
    <Box sx={{ mt: 3, width: '100%' }}>
      <Typography variant="h6" gutterBottom>Select Column for Names</Typography>
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
                maxHeight: 600, // Show at least 12-15 items (each item ~40-48px)
              }
            }
          }}
        >
          {columns.map((column) => (
            <MenuItem key={column.original} value={column.original}>
              {column.display}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default ColumnSelector;

