import { createTheme, type ThemeOptions } from '@mui/material/styles';

/**
 * Custom MUI v7 Theme Configuration
 *
 * Design System:
 * - Primary Color: Indigo (professional, modern)
 * - Secondary Color: Emerald (success, growth)
 * - Accent Color: Amber (highlights, warnings)
 * - Neutral Grays: Professional tonal range
 * - Typography: Roboto with clear hierarchy
 * - Spacing: 8px base unit for consistency
 * - Border Radius: Modern rounded corners
 * - Shadows: Subtle depth with smooth transitions
 */

// Color palette constants
const colors = {
  // Primary - Indigo (professional, trustworthy)
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1', // Main primary
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },
  // Secondary - Emerald (success, growth)
  secondary: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981', // Main secondary
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  // Error - Rose
  error: {
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
  },
  // Warning - Amber
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  // Info - Sky
  info: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  // Success - Emerald
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
};

// Typography configuration
const typography = {
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  h1: {
    fontWeight: 700,
    fontSize: '2.5rem',
    lineHeight: 1.2,
  },
  h2: {
    fontWeight: 700,
    fontSize: '2rem',
    lineHeight: 1.3,
  },
  h3: {
    fontWeight: 600,
    fontSize: '1.75rem',
    lineHeight: 1.4,
  },
  h4: {
    fontWeight: 600,
    fontSize: '1.5rem',
    lineHeight: 1.4,
  },
  h5: {
    fontWeight: 600,
    fontSize: '1.25rem',
    lineHeight: 1.5,
  },
  h6: {
    fontWeight: 600,
    fontSize: '1rem',
    lineHeight: 1.5,
  },
  subtitle1: {
    fontWeight: 500,
    fontSize: '1rem',
    lineHeight: 1.75,
  },
  subtitle2: {
    fontWeight: 500,
    fontSize: '0.875rem',
    lineHeight: 1.75,
  },
  body1: {
    fontWeight: 400,
    fontSize: '1rem',
    lineHeight: 1.7,
  },
  body2: {
    fontWeight: 400,
    fontSize: '0.875rem',
    lineHeight: 1.6,
  },
  button: {
    fontWeight: 600,
    fontSize: '0.875rem',
    lineHeight: 1.5,
    textTransform: 'none' as const,
  },
  caption: {
    fontWeight: 400,
    fontSize: '0.75rem',
    lineHeight: 1.66,
  },
  overline: {
    fontWeight: 600,
    fontSize: '0.75rem',
    lineHeight: 2.66,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
};

// Spacing scale (8px base unit)
const spacing = (factor: number) => `${8 * factor}px`;

// Shape configuration
const shape = {
  borderRadius: 12,
  borderRadiusSmall: 8,
  borderRadiusLarge: 16,
};

// Shadow customization
const shadows = [
  'none',
  '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  // Custom shadows for specific use cases
  '0 0 0 1px rgb(0 0 0 / 0.05)', // Subtle border
  '0 4px 12px rgb(0 0 0 / 0.08)', // Card hover
  '0 8px 24px rgb(0 0 0 / 0.12)', // Elevated card
];

// Light theme configuration
export const lightTheme: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: colors.primary[500],
      light: colors.primary[300],
      dark: colors.primary[700],
      contrastText: '#ffffff',
    },
    secondary: {
      main: colors.secondary[500],
      light: colors.secondary[300],
      dark: colors.secondary[700],
      contrastText: '#ffffff',
    },
    error: {
      main: colors.error[500],
      light: colors.error[300],
      dark: colors.error[700],
    },
    warning: {
      main: colors.warning[500],
      light: colors.warning[300],
      dark: colors.warning[700],
    },
    info: {
      main: colors.info[500],
      light: colors.info[300],
      dark: colors.info[700],
    },
    success: {
      main: colors.success[500],
      light: colors.success[300],
      dark: colors.success[700],
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: 'rgba(15, 23, 42, 0.87)',
      secondary: 'rgba(15, 23, 42, 0.6)',
      disabled: 'rgba(15, 23, 42, 0.38)',
    },
    divider: 'rgba(15, 23, 42, 0.08)',
  },
  typography,
  shape,
  shadows: shadows as any,
  spacing: spacing as any,

  // Component overrides
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f8fafc',
          backgroundImage: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          backgroundAttachment: 'fixed',
        },
      },
    },

    // Button customization
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: shape.borderRadiusSmall,
          padding: '8px 16px',
          transition: 'all 0.2s ease-in-out',
          fontWeight: 600,
        },
        contained: {
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
      },
      defaultProps: {
        disableElevation: false,
      },
    },

    // Card/Paper customization
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          transition: 'box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out',
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        },
        elevation2: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        },
        elevation3: {
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
        },
      },
    },

    // Input field customization
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: shape.borderRadiusSmall,
          '&:hover': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.primary[300],
            },
          },
        },
      },
    },

    // Table customization
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: colors.primary[50],
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          color: colors.primary[900],
          borderBottom: `2px solid ${colors.primary[200]}`,
        },
        body: {
          borderBottom: `1px solid ${colors.primary[100]}`,
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: colors.primary[50],
          },
        },
      },
    },

    // Chip customization
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
        },
      },
    },

    // Card customization
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: shape.borderRadius,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },

    // Dialog customization
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: shape.borderRadiusLarge,
        },
      },
    },

    // AppBar customization
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },

  // Breakpoints
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },

  // Transitions
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
};

// Dark theme configuration
export const darkTheme: ThemeOptions = {
  ...lightTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: colors.primary[400],
      light: colors.primary[300],
      dark: colors.primary[600],
      contrastText: '#ffffff',
    },
    secondary: {
      main: colors.secondary[400],
      light: colors.secondary[300],
      dark: colors.secondary[600],
      contrastText: '#ffffff',
    },
    error: {
      main: colors.error[400],
      light: colors.error[300],
      dark: colors.error[600],
    },
    warning: {
      main: colors.warning[400],
      light: colors.warning[300],
      dark: colors.warning[600],
    },
    info: {
      main: colors.info[400],
      light: colors.info[300],
      dark: colors.info[600],
    },
    success: {
      main: colors.success[400],
      light: colors.success[300],
      dark: colors.success[600],
    },
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
    text: {
      primary: 'rgba(248, 250, 252, 0.87)',
      secondary: 'rgba(248, 250, 252, 0.6)',
      disabled: 'rgba(248, 250, 252, 0.38)',
    },
    divider: 'rgba(248, 250, 252, 0.08)',
  },
  components: {
    ...lightTheme.components,
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0f172a',
          backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          backgroundAttachment: 'fixed',
        },
      },
    },
  },
};

// Create the themes
export const theme = createTheme(lightTheme);
export const themeDark = createTheme(darkTheme);

// Export colors for use in components
export { colors };
export type { ThemeOptions } from '@mui/material/styles';
