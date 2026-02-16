// src/components/DashboardView/DraggableColumnSelector.tsx
import React, { useState, useCallback } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
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

const DraggableColumnSelectorInner: React.FC<DraggableColumnSelectorProps> = ({
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

  // Removed debug logging to prevent infinite loop

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, [label]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [label]);


  return (
    <>
      <FormControl sx={{ minWidth: 250 }} size="small">
        <InputLabel id={`draggable-selector-label-${label}`}>{label}</InputLabel>
        <OutlinedInput
          label={label}
          id={`draggable-selector-${label}`}
          readOnly
          onClick={handleOpen} // Open dialog on click anywhere on the input
          value={selected.length > 0 ? `${selected.length} column${selected.length > 1 ? 's' : ''} selected` : ''}
          placeholder={`Select ${label.toLowerCase()}...`}
          sx={{ cursor: 'pointer' }}
          endAdornment={
            <IconButton onClick={handleOpen} edge="end" aria-label={`edit ${label}`} size="small">
              <EditIcon fontSize="small" />
            </IconButton>
          }
        />
      </FormControl>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        fullScreen={fullScreen}
        // keepMounted removed - causing layout issues with large datasets
        disableEnforceFocus={true} // Prevent focus management thrashing
        disableScrollLock={true} // Prevent scroll position calculations that may cause layout thrashing
        transitionDuration={0} // Instant transition - no fade/slide animation
        sx={{
          // Ensure dialog doesn't cause parent layout recalculation
          '& .MuiDialog-container': {
            alignItems: 'flex-start', // Prevent vertical centering layout thrash
          },
          zIndex: 9999, // Ensure proper z-index layering
        }}
        TransitionProps={{
          onEntered: () => {
            // Dialog content is now visible
          },
        }}
      > {/* Add fullScreen prop */}
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
        <DialogContent sx={{ p: 0, borderTop: 'none' }}>
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

// Memoize the component to prevent unnecessary re-renders
const DraggableColumnSelector = React.memo(DraggableColumnSelectorInner);

DraggableColumnSelector.displayName = 'DraggableColumnSelector';

export default DraggableColumnSelector;
