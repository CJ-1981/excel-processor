import React, { useState, useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box, Typography, ListSubheader } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { debug } from '../utils/logger';

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
  const { t } = useTranslation();

  const [columns, setColumns] = useState<ColumnOption[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(1);

  useEffect(() => {
    if (data.length > 0) {
      debug('ColumnSelector', 'data[0] sample:', data[0]);
      debug('ColumnSelector', 'all keys:', Object.keys(data[0]));

      // Get column headers from the data structure
      const rawHeaders = Object.keys(data[0]);
      const isPlaceholder = (k: string) => /^[A-Z]+$/.test(k) || /^__EMPTY/.test(k);
      // Exclude all metadata/system keys that start with underscore (e.g., _source*, __rowNum__)
      const nonMetaKeys = rawHeaders.filter(h => !h.startsWith('_'));
      const hasRealHeaders = nonMetaKeys.length > 0 && !nonMetaKeys.every(isPlaceholder);
      const rowsToScan = Math.min(3, data.length);
      const allColumns: ColumnOption[] = [];

      debug('ColumnSelector', 'rawHeaders:', rawHeaders);

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
      debug('ColumnSelector', 'allColumns built:', allColumns.length, 'options');

      // Auto-select column intelligently
      // Priority: 1) Column with name-related keywords, 2) First non-empty column
      const nameKeywords = ['name', '이름', '성명', 'Name', 'NAME', '이름 ', ' 성명'];

      // Function to check if a value contains name-related keywords
      const isNameRelated = (value: string): boolean => {
        return nameKeywords.some(keyword => value.toLowerCase().includes(keyword.toLowerCase()));
      };

      // First, try to find a column with name-related keyword in header or value
      const nameColumn = allColumns.find(col =>
        isNameRelated(col.original) || isNameRelated(col.display) || isNameRelated(col.value)
      );

      if (nameColumn) {
        debug('ColumnSelector', 'auto-selecting name column:', nameColumn);
        setSelectedColumn(nameColumn.original);
        const effectiveRowIndex = hasRealHeaders ? 0 : nameColumn.rowIndex;
        setSelectedRowIndex(effectiveRowIndex);
        onColumnSelect(nameColumn.original, effectiveRowIndex);
      } else {
        // Fallback: auto-select first column with non-empty value from first row
        const firstNonEmpty = allColumns.find(col => col.rowIndex === 1 && col.value !== '(empty)');
        if (firstNonEmpty) {
          debug('ColumnSelector', 'auto-selecting first non-empty:', firstNonEmpty);
          setSelectedColumn(firstNonEmpty.original);
          const effectiveRowIndex = hasRealHeaders ? 0 : firstNonEmpty.rowIndex;
          setSelectedRowIndex(effectiveRowIndex);
          onColumnSelect(firstNonEmpty.original, effectiveRowIndex);
        } else if (allColumns.length > 0) {
          debug('ColumnSelector', 'selecting first available:', allColumns[0]);
          setSelectedColumn(allColumns[0].original);
          const effectiveRowIndex = hasRealHeaders ? 0 : allColumns[0].rowIndex;
          setSelectedRowIndex(effectiveRowIndex);
          onColumnSelect(allColumns[0].original, effectiveRowIndex);
        } else {
          debug('ColumnSelector', 'no columns to select!');
        }
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
      debug('ColumnSelector', 'user selected:', selectedCol);
      setSelectedColumn(originalColumnName);
      // Detect if headers are already in keys (CSV) and override to 0
      const rawHeaders = Object.keys(data[0] || {});
      const isPlaceholder = (k: string) => /^[A-Z]+$/.test(k) || /^__EMPTY/.test(k);
      const nonMetaKeys = rawHeaders.filter(h => !h.startsWith('_'));
      const hasRealHeaders = nonMetaKeys.length > 0 && !nonMetaKeys.every(isPlaceholder);
      const effectiveRowIndex = hasRealHeaders ? 0 : rowIndex;
      setSelectedRowIndex(effectiveRowIndex);
      onColumnSelect(originalColumnName, effectiveRowIndex);
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

  debug('ColumnSelector', 'groupedColumns:', Object.keys(groupedColumns));
  debug('ColumnSelector', 'selectedColumn value:', selectedColumn);

  if (data.length === 0) {
    return null;
  }

  if (columns.length === 0) {
    debug('ColumnSelector', 'no columns available!');
    return null;
  }

  return (
    <Box sx={{ mt: 3, width: '100%' }}>
      <Typography variant="h6" gutterBottom>{t('columnSelector.title')}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {t('columnSelector.subtitle')}
      </Typography>
      <FormControl fullWidth>
        <InputLabel id="column-select-label">{t('columnSelector.label')}</InputLabel>
        <Select
          labelId="column-select-label"
          id="column-select"
          value={selectedRowIndex ? `${selectedRowIndex}-${selectedColumn}` : ''}
          label={t('columnSelector.label')}
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
              {t('columnSelector.row', { number: rowNum })}
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
