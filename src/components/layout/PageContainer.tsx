import { Container } from '@mui/material';
import type { SxProps, Theme } from '@mui/system';
import type { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  sx?: SxProps<Theme>;
}

/**
 * Consistent page wrapper with proper spacing and responsive breakpoints.
 * Provides a standardized layout container for the application.
 */
export default function PageContainer({ children, maxWidth = 'lg', sx }: PageContainerProps) {
  return (
    <Container
      maxWidth={maxWidth}
      sx={{
        minHeight: 'calc(100vh - 400px)', // Adjust for hero band
        py: { xs: 4, sm: 6, md: 8 }, // Marketing section-style spacing
        px: { xs: 2, sm: 3, md: 4 },
        display: 'flex',
        flexDirection: 'column',
        ...sx
      }}
    >
      {children}
    </Container>
  );
}
