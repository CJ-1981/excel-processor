// src/components/DashboardView/DraggableColumnSelector.tsx
import React, { useState, useCallback } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Chip,
  Typography,
  FormControl,
  InputLabel,
  OutlinedInput,
  IconButton,
  useMediaQuery, // Import useMediaQuery
  useTheme, // Import useTheme
} from '@mui/material';
import DraggableColumnList from './DraggableColumnList';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';

interface DraggableColumnSelectorProps {
  options: string[];
  selected: string[];
  columnMapping: Record<string, string>;
  onToggle: (column: string) => void;
  onReorder: (result: any) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  label: string;
}

const DraggableColumnSelector: React.FC<DraggableColumnSelectorProps> = ({
  options,
  selected,
  columnMapping,
  onToggle,
  onReorder,
  onSelectAll,
  onDeselectAll,
  label,
}) => {
  const [open, setOpen] = useState(false);
  const theme = useTheme(); // Initialize useTheme
  const fullScreen = useMediaQuery(theme.breakpoints.down('md')); // Full screen on 'md' breakpoint and below

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  const handleChipDelete = useCallback((column: string) => {
    onToggle(column);
  }, [onToggle]);

  return (
    <>
      <FormControl sx={{ minWidth: 250 }} size="small">
        <InputLabel id={`draggable-selector-label-${label}`}>{label}</InputLabel>
        <OutlinedInput
          label={label}
          id={`draggable-selector-${label}`}
          readOnly
          onClick={handleOpen}
          sx={{ display: 'flex', alignItems: 'center', py: 0.5, overflowX: 'auto' }}
          notched
          endAdornment={
            <IconButton onClick={handleOpen} edge="end" aria-label={`edit ${label}`} size="small">
              <EditIcon fontSize="small" />
            </IconButton>
          }
        >
          <Box sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.5,
            justifyContent: 'flex-start',
            alignItems: 'center',
            minHeight: '24px',
            p: 0.5,
          }}>
            {selected.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Select {label.toLowerCase()}...
              </Typography>
            ) : (
              selected.map((col) => (
                <Chip
                  key={col}
                  label={columnMapping[col] || col}
                  onDelete={() => handleChipDelete(col)}
                  size="small"
                  deleteIcon={<CloseIcon fontSize="small" />}
                  onClick={(e) => e.stopPropagation()}
                />
              ))
            )}
          </Box>
        </OutlinedInput>
      </FormControl>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth fullScreen={fullScreen}> {/* Add fullScreen prop */}
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {`Select and Reorder ${label}`}
            {fullScreen && ( // Add a close button for fullScreen dialogs
              <IconButton edge="end" color="inherit" onClick={handleClose} aria-label="close">
                <CloseIcon />
              </IconButton>
            )}
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <DraggableColumnList
            options={options}
            selected={selected}
            columnMapping={columnMapping}
            onToggle={onToggle}
            onReorder={onReorder}
            onSelectAll={onSelectAll}
            onDeselectAll={onDeselectAll}
          />
        </DialogContent>
        {!fullScreen && ( // Only show action buttons if not full screen (full screen dialogs have close button in title)
          <DialogActions>
            <Button onClick={handleClose}>Close</Button>
          </DialogActions>
        )}
      </Dialog>
    </>
  );
};

export default DraggableColumnSelector;
