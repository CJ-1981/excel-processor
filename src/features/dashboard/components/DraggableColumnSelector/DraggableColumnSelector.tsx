// src/features/dashboard/components/DraggableColumnSelector/DraggableColumnSelector.tsx
import React, { useCallback } from 'react';
import {
  Typography,
  Box,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface DraggableColumnSelectorProps {
  options: string[];
  selected: string[];
  columnMapping: Record<string, string>;
  onApplyChanges: (newSelected: string[]) => void;
  label: string;
}

const DraggableColumnSelectorInner: React.FC<DraggableColumnSelectorProps> = ({
  options,
  selected,
  columnMapping,
  onApplyChanges,
  label,
}) => {
  const handleSelectChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, opt => opt.value);
    onApplyChanges(selectedOptions);
  }, [onApplyChanges]);

  return (
    <Box sx={{ minWidth: 250 }} onMouseDown={(e) => e.stopPropagation()}>
      <Box sx={{ position: 'relative' }}>
        <Typography
          variant="caption"
          sx={{ mb: 0.5, ml: 1.5, color: 'text.secondary' }}
        >
          {label}
        </Typography>
        <Box
          component="select"
          multiple
          value={selected}
          onChange={handleSelectChange}
          onMouseDown={(e) => e.stopPropagation()}
          sx={{
            width: '100%',
            minHeight: 32,
            px: 1,
            py: 0.5,
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'rgba(0, 0, 0, 0.23)',
            bgcolor: 'background.paper',
            fontSize: '0.875rem',
            cursor: 'pointer',
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            msAppearance: 'none',
            '&:hover': {
              borderColor: 'primary.main',
            },
            '&:focus': {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: -2,
            },
            '& option': {
              py: 1,
              px: 1,
            },
          }}
        >
          {options.map((column) => (
            <option key={column} value={column}>
              {(selected.includes(column) ? '✓ ' : '')}{columnMapping[column] || column}
            </option>
          ))}
        </Box>
        <Box
          sx={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}
        >
          <ExpandMoreIcon fontSize="small" sx={{ color: 'text.secondary' }} />
        </Box>
      </Box>
    </Box>
  );
};

// Memoize the component to prevent unnecessary re-renders
const DraggableColumnSelector = React.memo(DraggableColumnSelectorInner);

DraggableColumnSelector.displayName = 'DraggableColumnSelector';

export default DraggableColumnSelector;
