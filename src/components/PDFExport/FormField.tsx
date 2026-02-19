import React from 'react';
import {
  TextField,
  Checkbox,
  Radio,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  RadioGroup,
  FormLabel,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';

interface FormFieldProps {
  type: 'text' | 'number' | 'checkbox' | 'select' | 'radio';
  label: string;
  value: any;
  onChange: (value: any) => void;
  options?: string[]; // For select type
  radioOptions?: Array<{value: string, label: string, helperText?: string}>; // For radio type
  radioGroupName?: string; // Required for radio type to group radios together
  disabled?: boolean;
  fullWidth?: boolean;
  sx?: any;
  textColor?: string; // For showing preview color in text input
  helperText?: string; // Helper text for form field
}

export const FormField: React.FC<FormFieldProps> = ({
  type,
  label,
  value,
  onChange,
  options,
  radioOptions,
  radioGroupName,
  disabled = false,
  fullWidth = true,
  sx,
  textColor,
  helperText,
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
          InputProps={{
            style: textColor ? { color: textColor } : undefined,
          }}
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
            style: textColor ? { color: textColor } : undefined,
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
              <Box>
                <Typography variant="body2" component="div">
                  {label}
                </Typography>
                {helperText && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    {helperText}
                  </Typography>
                )}
              </Box>
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

    case 'radio':
      return (
        <FormControl sx={baseSx} fullWidth={fullWidth}>
          <FormLabel component="legend">{label}</FormLabel>
          <RadioGroup
            name={radioGroupName || 'radio-group'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            {radioOptions?.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body2" component="div">
                      {option.label}
                    </Typography>
                    {option.helperText && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        {option.helperText}
                      </Typography>
                    )}
                  </Box>
                }
              />
            ))}
          </RadioGroup>
        </FormControl>
      );

    default:
      return null;
  }
};
