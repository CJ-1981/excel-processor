/// <reference path="./theme.d.ts" />
import { createTheme, alpha } from '@mui/material/styles';
import type { PaletteMode } from '@mui/material';

/**
 * MongoDB-inspired design tokens
 */
export const colors = {
  brandGreen: '#00ED64',
  brandGreenDark: '#00684A',
  brandGreenMid: '#00A35C',
  brandGreenSoft: '#E3FCF7',
  brandTealDeep: '#001E2B',
  brandTeal: '#00684A',
  brandTealMid: '#00A35C',
  canvas: '#FFFFFF',
  canvasDark: '#001E2B',
  ink: '#001E2B',
  hairline: '#E8EDEB',
  hairlineStrong: '#C1C7C6',
  hairlineDark: '#21313C',
  slate: '#5D6C7C',
  steel: '#88939E',
  surface: '#F9FBFA',
  surfaceDark: '#061621',
  surfaceFeature: '#E3FCF7',
};

export const getTheme = (mode: PaletteMode) => createTheme({
  palette: {
    mode,
    primary: {
      main: colors.brandGreen,
      dark: colors.brandGreenDark,
      light: colors.brandGreenSoft,
      contrastText: colors.brandTealDeep, // Ink on green
    },
    secondary: {
      main: colors.brandTealDeep,
      contrastText: '#FFFFFF',
    },
    text: {
      primary: mode === 'light' ? colors.ink : '#FFFFFF',
      secondary: mode === 'light' ? colors.slate : colors.steel,
      disabled: mode === 'light' ? '#4A5568' : colors.steel,
    },
    background: {
      default: mode === 'light' ? colors.canvas : colors.surfaceDark,
      paper: mode === 'light' ? colors.canvas : colors.canvasDark,
    },
    divider: mode === 'light' ? colors.hairline : colors.hairlineDark,
    // Custom utility colors
    surface: mode === 'light' ? colors.surface : colors.surfaceDark,
    hairline: mode === 'light' ? colors.hairline : colors.hairlineDark,
    hairlineSoft: mode === 'light' ? alpha(colors.hairline, 0.5) : alpha(colors.hairlineDark, 0.5),
    hairlineStrong: mode === 'light' ? colors.hairlineStrong : '#3D4D5C',
    surfaceFeature: mode === 'light' ? colors.surfaceFeature : alpha(colors.brandGreen, 0.05),
    ink: colors.ink,
    steel: colors.steel,
    action: {
      hover: alpha(colors.brandGreen, 0.08),
      selected: alpha(colors.brandGreen, 0.16),
    },
  },
  shape: {
    borderRadius: 12, // rounded.lg
  },
  typography: {
    fontFamily: [
      'Euclid Circular A',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: { fontWeight: 500 },
    h2: { fontWeight: 500 },
    h3: { fontWeight: 500 },
    h4: { fontWeight: 500 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 9999, // rounded.full (pill)
          padding: '10px 22px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        containedPrimary: {
          backgroundColor: colors.brandGreen,
          color: colors.brandTealDeep,
          '&:hover': {
            backgroundColor: colors.brandGreenMid,
          },
        },
        outlinedPrimary: {
          borderColor: mode === 'light' ? colors.hairlineStrong : colors.hairlineDark,
          color: mode === 'light' ? colors.ink : '#FFFFFF',
          '&:hover': {
            backgroundColor: mode === 'light' ? colors.surface : alpha(colors.brandGreen, 0.04),
            borderColor: colors.brandGreen,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          border: `1px solid ${mode === 'light' ? colors.hairline : colors.hairlineDark}`,
          boxShadow: mode === 'light' ? '0px 4px 12px rgba(0, 30, 43, 0.08)' : 'none',
        },
        elevation0: {
          border: `1px solid ${mode === 'light' ? colors.hairline : colors.hairlineDark}`,
          boxShadow: 'none',
        },
        elevation1: {
          boxShadow: mode === 'light' ? '0px 1px 2px rgba(0, 30, 43, 0.04)' : 'none',
        },
        elevation2: {
          boxShadow: mode === 'light' ? '0px 4px 12px rgba(0, 30, 43, 0.08)' : 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid ${mode === 'light' ? colors.hairline : colors.hairlineDark}`,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 9999,
          fontWeight: 600,
        },
        outlined: {
          borderColor: mode === 'light' ? colors.hairlineStrong : colors.hairlineDark,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'light' ? colors.canvas : colors.canvasDark,
          color: mode === 'light' ? colors.ink : '#FFFFFF',
          boxShadow: 'none',
          borderBottom: `1px solid ${mode === 'light' ? colors.hairline : colors.hairlineDark}`,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
    MuiStepper: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
        },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          '&.Mui-active': {
            color: mode === 'light' ? colors.brandTealDeep : colors.brandGreen,
          },
          '&.Mui-completed': {
            color: colors.brandGreenMid,
          },
        },
      },
    },
  },
});

export default getTheme;
