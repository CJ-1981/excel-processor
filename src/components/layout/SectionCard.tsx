import { Paper } from '@mui/material';
import type { PaperProps } from '@mui/material/Paper';
import type { SxProps, Theme } from '@mui/system';
import type { ReactNode } from 'react';

interface SectionCardProps extends Omit<PaperProps, 'sx'> {
  children: ReactNode;
  sx?: SxProps<Theme>;
  elevation?: number;
  variant?: 'elevation' | 'outlined';
}

/**
 * Reusable card component for sections with consistent elevation and spacing.
 * Provides visual grouping and depth to content sections.
 */
export default function SectionCard({ children, sx, elevation = 1, variant = 'elevation', ...props }: SectionCardProps) {
  return (
    <Paper
      elevation={elevation}
      variant={variant}
      sx={{
        p: { xs: 2, sm: 2.5, md: 4 },
        borderRadius: 1, // Uses theme.shape.borderRadius (12px)
        border: (theme) => `1px solid ${theme.palette.divider}`,
        transition: 'all 0.3s ease-in-out',
        '&:hover': elevation > 0 ? {
          boxShadow: '0px 8px 24px rgba(0, 30, 43, 0.12)',
        } : {},
        ...sx
      }}
      {...props}
    >
      {children}
    </Paper>
  );
}
