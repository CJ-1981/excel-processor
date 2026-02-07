import React from 'react';
import {
  TextField,
  Checkbox,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';

interface FormFieldProps {
  type: 'text' | 'number' | 'checkbox' | 'select';
  label: string;
  value: any;
  onChange: (value: any) => void;
  options?: string[]; // For select type
  disabled?: boolean;
  fullWidth?: boolean;
  sx?: any;
}

export const FormField: React.FC<FormFieldProps> = ({
  type,
  label,
  value,
  onChange,
  options,
  disabled = false,
  fullWidth = true,
  sx,
}) => {
  const baseSx = { mb: 2, ...sx };

  switch (type) {
    case 'text':
      return (
        <TextField
          label={label}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          fullWidth={fullWidth}
          sx={baseSx}
          size="small"
        />
      );

    case 'number':
      return (
        <TextField
          label={label}
          type="number"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          disabled={disabled}
          fullWidth={fullWidth}
          sx={baseSx}
          size="small"
          InputProps={{
            inputProps: { step: '0.01', min: '0' },
          }}
        />
      );

    case 'checkbox':
      return (
        <Box sx={baseSx}>
          <FormControlLabel
            control={
              <Checkbox
                checked={value === true || value === 'true'}
                onChange={(e) => onChange(e.target.checked)}
                disabled={disabled}
              />
            }
            label={
              <Typography variant="body2" component="div">
                {label}
              </Typography>
            }
          />
        </Box>
      );

    case 'select':
      return (
        <FormControl fullWidth={fullWidth} sx={baseSx} size="small">
          <InputLabel id={`select-${label}`}>{label}</InputLabel>
          <Select
            labelId={`select-${label}`}
            value={value || ''}
            label={label}
            onChange={(e: SelectChangeEvent<string>) => onChange(e.target.value)}
            disabled={disabled}
          >
            {options?.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );

    default:
      return null;
  }
};
