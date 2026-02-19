import { Paper } from '@mui/material';
import type { PaperProps } from '@mui/material/Paper';
import type { SxProps, Theme } from '@mui/system';
import { ReactNode } from 'react';

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
export default function SectionCard({ children, sx, elevation = 2, variant = 'elevation', ...props }: SectionCardProps) {
  return (
    <Paper
      elevation={elevation}
      variant={variant}
      sx={{
        p: 3,
        borderRadius: 2,
        transition: 'box-shadow 0.3s ease-in-out',
        '&:hover': elevation > 0 ? {
          boxShadow: (theme) => theme.shadows[elevation + 2]
        } : {},
        ...sx
      }}
      {...props}
    >
      {children}
    </Paper>
  );
}
