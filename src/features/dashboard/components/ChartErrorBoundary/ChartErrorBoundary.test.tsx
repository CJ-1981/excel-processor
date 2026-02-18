/**
 * Specification tests for ChartErrorBoundary component
 *
 * TDD approach: RED-GREEN-REFACTOR cycle
 * Tests define expected behavior for error boundary handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChartErrorBoundary from './ChartErrorBoundary';

// Mock console.error to avoid test output pollution
const originalConsoleError = console.error;

describe('ChartErrorBoundary', () => {
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  const mockChildren = <div data-testid="test-children">Test Content</div>;
  const fallbackMock = <div data-testid="custom-fallback">Custom Fallback</div>;

  describe('Normal Rendering', () => {
    it('should render children when no error occurs', () => {
      render(
        <ChartErrorBoundary>{mockChildren}</ChartErrorBoundary>
      );

      expect(screen.getByTestId('test-children')).toBeInTheDocument();
    });

    it('should not render error UI in normal state', () => {
      render(
        <ChartErrorBoundary>{mockChildren}</ChartErrorBoundary>
      );

      expect(screen.queryByText(/failed to load chart/i)).not.toBeInTheDocument();
    });
  });

  describe('ChunkLoadError Handling', () => {
    it('should catch ChunkLoadError and display error message', () => {
      const ThrowChunkError = () => {
        throw new Error('ChunkLoadError: Loading chunk failed');
      };

      render(
        <ChartErrorBoundary>
          <ThrowChunkError />
        </ChartErrorBoundary>
      );

      expect(screen.getByText(/failed to load chart/i)).toBeInTheDocument();
    });

    it('should display user-friendly message for chunk loading failure', () => {
      const ThrowChunkError = () => {
        throw new Error('ChunkLoadError: Loading chunk 1 failed');
      };

      render(
        <ChartErrorBoundary>
          <ThrowChunkError />
        </ChartErrorBoundary>
      );

      expect(screen.getByText(/network connection/i)).toBeInTheDocument();
      expect(screen.getByText(/try again/i)).toBeInTheDocument();
    });

    it('should detect ChunkLoadError variations', () => {
      const errorMessages = [
        'ChunkLoadError: Loading chunk 2 failed',
        'Loading chunk 3 failed',
        'chunk loading error',
      ];

      errorMessages.forEach((errorMessage) => {
        const ThrowError = () => {
          throw new Error(errorMessage);
        };

        const { unmount } = render(
          <ChartErrorBoundary>
            <ThrowError />
          </ChartErrorBoundary>
        );

        expect(screen.getByText(/failed to load chart/i)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Retry Functionality', () => {
    it('should display retry button when chunk loading fails', () => {
      const ThrowChunkError = () => {
        throw new Error('ChunkLoadError: Loading chunk failed');
      };

      render(
        <ChartErrorBoundary>
          <ThrowChunkError />
        </ChartErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should call onRetry callback when retry button is clicked', async () => {
      const onRetryMock = vi.fn();
      const ThrowChunkError = () => {
        throw new Error('ChunkLoadError: Loading chunk failed');
      };

      render(
        <ChartErrorBoundary onRetry={onRetryMock}>
          <ThrowChunkError />
        </ChartErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await userEvent.click(retryButton);

      expect(onRetryMock).toHaveBeenCalledTimes(1);
    });

    it('should reload window when retry clicked and no onRetry provided', async () => {
      const reloadMock = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock },
        writable: true,
      });

      const ThrowChunkError = () => {
        throw new Error('ChunkLoadError: Loading chunk failed');
      };

      render(
        <ChartErrorBoundary>
          <ThrowChunkError />
        </ChartErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await userEvent.click(retryButton);

      expect(reloadMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Logging', () => {
    it('should log error details to console', () => {
      const testError = new Error('ChunkLoadError: Loading chunk failed');
      const ThrowError = () => {
        throw testError;
      };

      render(
        <ChartErrorBoundary>
          <ThrowError />
        </ChartErrorBoundary>
      );

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ChartErrorBoundary]'),
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it('should include error info in log', () => {
      const testError = new Error('Test error');
      const ThrowError = () => {
        throw testError;
      };

      render(
        <ChartErrorBoundary>
          <ThrowError />
        </ChartErrorBoundary>
      );

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Custom Fallback', () => {
    it('should render custom fallback when provided', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <ChartErrorBoundary fallback={fallbackMock}>
          <ThrowError />
        </ChartErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    });

    it('should not render default error UI when custom fallback provided', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <ChartErrorBoundary fallback={fallbackMock}>
          <ThrowError />
        </ChartErrorBoundary>
      );

      expect(screen.queryByText(/failed to load chart/i)).not.toBeInTheDocument();
    });
  });

  describe('Generic Error Handling', () => {
    it('should catch and display generic errors', () => {
      const ThrowError = () => {
        throw new Error('Generic error occurred');
      };

      render(
        <ChartErrorBoundary>
          <ThrowError />
        </ChartErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('should handle non-Error objects', () => {
      const ThrowString = () => {
        throw 'String error';
      };

      render(
        <ChartErrorBoundary>
          <ThrowString />
        </ChartErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('should handle null errors', () => {
      const ThrowNull = () => {
        throw null;
      };

      render(
        <ChartErrorBoundary>
          <ThrowNull />
        </ChartErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  describe('State Reset', () => {
    it('should reset error state when retry succeeds', async () => {
      const ThrowError = () => {
        throw new Error('ChunkLoadError: Loading chunk failed');
      };

      const { rerender } = render(
        <ChartErrorBoundary>
          <ThrowError />
        </ChartErrorBoundary>
      );

      expect(screen.getByText(/failed to load chart/i)).toBeInTheDocument();

      // After error, if we re-render with non-erroring children, error should be cleared
      // This simulates the user clicking retry and the component successfully loading
      const SuccessComponent = () => <div data-testid="success-content">Success</div>;

      rerender(
        <ChartErrorBoundary key="retry">
          <SuccessComponent />
        </ChartErrorBoundary>
      );

      // Error UI should be gone and new content should render
      await waitFor(() => {
        expect(screen.queryByText(/failed to load chart/i)).not.toBeInTheDocument();
      });
      expect(screen.getByTestId('success-content')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render error message with proper heading', () => {
      const ThrowError = () => {
        throw new Error('ChunkLoadError: Loading chunk failed');
      };

      render(
        <ChartErrorBoundary>
          <ThrowError />
        </ChartErrorBoundary>
      );

      const heading = screen.getByRole('heading');
      expect(heading).toBeInTheDocument();
    });

    it('should provide descriptive button label', () => {
      const ThrowError = () => {
        throw new Error('ChunkLoadError: Loading chunk failed');
      };

      render(
        <ChartErrorBoundary>
          <ThrowError />
        </ChartErrorBoundary>
      );

      const button = screen.getByRole('button', { name: /retry loading chart/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle errors during initial render', () => {
      const ThrowImmediately = () => {
        throw new Error('Immediate error');
      };

      expect(() => {
        render(
          <ChartErrorBoundary>
            <ThrowImmediately />
          </ChartErrorBoundary>
        );
      }).not.toThrow();
    });

    it('should handle errors from deeply nested components', () => {
      const DeepError = () => {
        throw new Error('Deep error');
      };

      const Wrapper = () => (
        <div>
          <div>
            <DeepError />
          </div>
        </div>
      );

      render(
        <ChartErrorBoundary>
          <Wrapper />
        </ChartErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('should preserve error state across re-renders', () => {
      const ThrowError = () => {
        throw new Error('Persistent error');
      };

      const { rerender } = render(
        <ChartErrorBoundary>
          <ThrowError />
        </ChartErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      rerender(
        <ChartErrorBoundary>
          <ThrowError />
        </ChartErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });
});
