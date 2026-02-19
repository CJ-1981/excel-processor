import { Container, Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/system';
import { ReactNode } from 'react';

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
      component="main"
      maxWidth={maxWidth}
      sx={{
        minHeight: '100vh',
        py: 4,
        display: 'flex',
        flexDirection: 'column',
        ...sx
      }}
    >
      {children}
    </Container>
  );
}
