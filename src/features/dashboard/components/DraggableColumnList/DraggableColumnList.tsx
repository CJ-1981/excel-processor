// src/features/dashboard/components/DraggableColumnList/DraggableColumnList.tsx
import React from 'react';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  IconButton,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

interface DraggableColumnListProps {
  options: string[];
  selected: string[];
  columnMapping: Record<string, string>;
  onToggle: (column: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

const DraggableColumnListInner = ({
  options,
  selected,
  columnMapping,
  onToggle,
  onReorder,
  onSelectAll,
  onDeselectAll,
}: DraggableColumnListProps) => {
  const isAllSelected = selected.length === options.length && options.length > 0;
  const isIndeterminate = selected.length > 0 && selected.length < options.length;

  return (
    <List dense sx={{ width: '100%' }}>
      {/* Select All / Deselect All */}
      <ListItem
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'action.hover',
          px: 2
        }}
      >
        <ListItemIcon sx={{ minWidth: 36 }}>
          <Checkbox
            edge="start"
            checked={isAllSelected}
            indeterminate={isIndeterminate}
            onChange={isAllSelected ? onDeselectAll : onSelectAll}
            size="small"
            sx={{ p: 0.5 }}
          />
        </ListItemIcon>
        <ListItemText
          primary={isAllSelected ? 'Deselect All' : 'Select All'}
          primaryTypographyProps={{ variant: 'subtitle2', fontWeight: 600 }}
          onClick={isAllSelected ? onDeselectAll : onSelectAll}
          sx={{ cursor: 'pointer' }}
        />
      </ListItem>

      <Divider />

      {/* Selected Columns with Reorder Controls */}
      {selected.length > 0 && (
        <>
          <Box sx={{ px: 2, pt: 2, pb: 1 }}>
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
              Selected ({selected.length})
            </Typography>
          </Box>
          {selected.map((column, index) => (
            <ListItem
              key={column}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                mx: 1,
                bgcolor: 'primary.50',
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 1, cursor: 'grab' }}>
                <DragHandleIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </Box>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Checkbox
                  edge="start"
                  checked={true}
                  onChange={() => onToggle(column)}
                  size="small"
                  sx={{ p: 0.5 }}
                />
              </ListItemIcon>
              <ListItemText
                primary={columnMapping[column] || column}
                primaryTypographyProps={{ variant: 'body2' }}
                onClick={() => onToggle(column)}
                sx={{ cursor: 'pointer', flex: 1 }}
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                <IconButton
                  size="small"
                  disabled={index === 0}
                  onClick={() => onReorder(index, index - 1)}
                  sx={{ p: 0.25 }}
                >
                  <ArrowUpwardIcon fontSize="inherit" />
                </IconButton>
                <IconButton
                  size="small"
                  disabled={index === selected.length - 1}
                  onClick={() => onReorder(index, index + 1)}
                  sx={{ p: 0.25 }}
                >
                  <ArrowDownwardIcon fontSize="inherit" />
                </IconButton>
              </Box>
            </ListItem>
          ))}
        </>
      )}

      {/* Available Columns */}
      {selected.length < options.length && (
        <>
          <Divider />
          <Box sx={{ px: 2, pt: 2, pb: 1 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
              Available ({options.length - selected.length})
            </Typography>
          </Box>
          {options
            .filter(col => !selected.includes(col))
            .map((column) => (
            <ListItem
              key={column}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                mx: 1,
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <Box sx={{ width: 24, mr: 1 }} /> {/* Spacer for alignment */}
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Checkbox
                  edge="start"
                  checked={false}
                  onChange={() => onToggle(column)}
                  size="small"
                  sx={{ p: 0.5 }}
                />
              </ListItemIcon>
              <ListItemText
                primary={columnMapping[column] || column}
                primaryTypographyProps={{ variant: 'body2' }}
                onClick={() => onToggle(column)}
                sx={{ cursor: 'pointer', flex: 1 }}
              />
            </ListItem>
          ))}
        </>
      )}
    </List>
  );
};

// Export memoized component
const DraggableColumnList = React.memo(DraggableColumnListInner);

export default DraggableColumnList;
