/**
 * ChartErrorBoundary Component
 *
 * Error boundary that catches chunk loading errors from React.lazy
 * and displays a recovery UI with retry functionality.
 */

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Alert, AlertTitle } from '@mui/material';
import { RefreshOutlined } from '@mui/icons-material';

export interface ChartErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
}

export interface ChartErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Checks if an error is related to chunk loading
 */
function isChunkLoadError(error: Error | null): boolean {
  if (!error) return false;
  const message = error.message.toLowerCase();
  const chunkErrorPatterns = ['chunkloaderror', 'loading chunk', 'chunk loading'];
  return chunkErrorPatterns.some((pattern) => message.includes(pattern));
}

/**
 * Normalizes various error types into Error objects
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'string') {
    return new Error(error);
  }
  if (error === null || error === undefined) {
    return new Error('Unknown error occurred');
  }
  return new Error(String(error));
}

/**
 * ChartErrorBoundary Component
 *
 * Catches React component errors, especially chunk loading errors
 * from lazy-loaded chart components.
 */
class ChartErrorBoundary extends Component<ChartErrorBoundaryProps, ChartErrorBoundaryState> {
  constructor(props: ChartErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: unknown): Partial<ChartErrorBoundaryState> {
    const errorObj = normalizeError(error);
    return {
      hasError: true,
      error: errorObj,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details for debugging
    console.error('[ChartErrorBoundary] Error caught:', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      errorType: error?.constructor?.name || 'Unknown',
      errorMessage: error?.message || 'Unknown error',
    });
  }

  handleRetry = (): void => {
    const { onRetry } = this.props;

    // Reset error state to allow re-render
    this.setState({
      hasError: false,
      error: null,
    });

    if (onRetry) {
      // Call custom retry handler
      onRetry();
    } else {
      // Default behavior: reload the page
      window.location.reload();
    }
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (!hasError) {
      return children;
    }

    // Use custom fallback if provided
    if (fallback) {
      return fallback;
    }

    // Default error UI
    const isChunkError = isChunkLoadError(error);

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 300,
          padding: 3,
        }}
      >
        <Alert
          severity="error"
          sx={{
            maxWidth: 500,
            width: '100%',
          }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={this.handleRetry}
              startIcon={<RefreshOutlined />}
              aria-label="Retry loading chart"
            >
              Try Again
            </Button>
          }
        >
          <AlertTitle component="h2">
            {isChunkError ? 'Failed to Load Chart' : 'Something Went Wrong'}
          </AlertTitle>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {isChunkError
              ? 'The chart failed to load due to a network connection issue. This can happen when your internet connection is unstable or the browser cache needs to be refreshed.'
              : 'An unexpected error occurred while rendering the chart. Please try refreshing the page.'}
          </Typography>
        </Alert>
      </Box>
    );
  }
}

export default ChartErrorBoundary;
