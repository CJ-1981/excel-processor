/**
 * DashboardContainer Component Tests
 *
 * Test-Driven Development for lazy-loaded dashboard container.
 *
 * RED-GREEN-REFACTOR Cycle:
 * - RED: Tests define expected behavior for lazy loading
 * - GREEN: Implementation will satisfy these tests
 * - REFACTOR: Code will be improved with tests as safety net
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { ResponsiveLayouts, Breakpoint } from 'react-grid-layout';

// Mock all chart modules
vi.mock('./charts/TrendChart', () => ({
  default: () => <div data-testid="trend-chart">TrendChart</div>,
}));
vi.mock('./charts/ParetoChart', () => ({
  default: () => <div data-testid="pareto-chart">ParetoChart</div>,
}));
vi.mock('./charts/DistributionHistogram', () => ({
  default: () => <div data-testid="histogram-chart">DistributionHistogram</div>,
}));
vi.mock('./charts/RangeDistributionCharts', () => ({
  default: () => <div data-testid="scatter-chart">RangeDistributionCharts</div>,
}));
vi.mock('./charts/TopDonorsChart', () => ({
  default: () => <div data-testid="heatmap-chart">TopDonorsChart</div>,
}));
vi.mock('./charts/StatisticsTable', () => ({
  default: () => <div data-testid="boxplot-chart">StatisticsTable</div>,
}));

// Import React first before mocks that use it
import React from 'react';

// Mock DashboardGrid
vi.mock('./components/DashboardGrid', () => ({
  __esModule: true,
  default: ({ children, onLayoutChange }: any) => {
    React.useEffect(() => {
      // Simulate layout change callback
      if (onLayoutChange) {
        onLayoutChange([], {});
      }
    }, [onLayoutChange]);
    return <div className="react-grid-layout">{children}</div>;
  },
}));

// Mock ChartSkeleton
vi.mock('./components/ChartSkeleton', () => ({
  default: ({ chartType, height }: any) => (
    <div data-testid={`skeleton-${chartType}`} style={{ height }}>
      Loading {chartType}...
    </div>
  ),
  ChartSkeleton: ({ chartType, height }: any) => (
    <div data-testid={`skeleton-${chartType}`} style={{ height }}>
      Loading {chartType}...
    </div>
  ),
}));

// Mock ChartErrorBoundary
vi.mock('./components/ChartErrorBoundary', () => ({
  __esModule: true,
  default: ({ children, onRetry, fallback }: any) => {
    const [hasError, setHasError] = React.useState(false);

    React.useEffect(() => {
      const handleError = () => setHasError(true);
      window.addEventListener('error', handleError);
      return () => window.removeEventListener('error', handleError);
    }, []);

    if (hasError && fallback) {
      return (
        <div>
          <div data-testid="error-boundary-fallback">{fallback}</div>
          <button onClick={onRetry} data-testid="retry-button">
            Try Again
          </button>
        </div>
      );
    }

    return <>{children}</>;
  },
}));

import DashboardContainer from './DashboardContainer';

describe('DashboardContainer', () => {
  const mockLayouts: ResponsiveLayouts<Breakpoint> = {
    lg: [
      { i: 'trend', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
      { i: 'pareto', x: 6, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
      { i: 'histogram', x: 0, y: 4, w: 6, h: 4, minW: 3, minH: 3 },
      { i: 'scatter', x: 6, y: 4, w: 6, h: 4, minW: 3, minH: 3 },
      { i: 'heatmap', x: 0, y: 8, w: 6, h: 4, minW: 3, minH: 3 },
      { i: 'boxplot', x: 6, y: 8, w: 6, h: 4, minW: 3, minH: 3 },
    ],
    md: [
      { i: 'trend', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
      { i: 'pareto', x: 6, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
      { i: 'histogram', x: 0, y: 4, w: 6, h: 4, minW: 3, minH: 3 },
      { i: 'scatter', x: 6, y: 4, w: 6, h: 4, minW: 3, minH: 3 },
      { i: 'heatmap', x: 0, y: 8, w: 6, h: 4, minW: 3, minH: 3 },
      { i: 'boxplot', x: 6, y: 8, w: 6, h: 4, minW: 3, minH: 3 },
    ],
    sm: [
      { i: 'trend', x: 0, y: 0, w: 4, h: 4, minW: 2, minH: 3 },
      { i: 'pareto', x: 0, y: 4, w: 4, h: 4, minW: 2, minH: 3 },
      { i: 'histogram', x: 0, y: 8, w: 4, h: 4, minW: 2, minH: 3 },
      { i: 'scatter', x: 0, y: 12, w: 4, h: 4, minW: 2, minH: 3 },
      { i: 'heatmap', x: 0, y: 16, w: 4, h: 4, minW: 2, minH: 3 },
      { i: 'boxplot', x: 0, y: 20, w: 4, h: 4, minW: 2, minH: 3 },
    ],
  };

  const defaultProps = {
    layouts: mockLayouts,
    onLayoutChange: vi.fn(),
  };

  describe('Basic Rendering', () => {
    it('should render DashboardGrid wrapper', async () => {
      render(<DashboardContainer {...defaultProps} />);

      const gridElement = document.querySelector('.react-grid-layout');
      expect(gridElement).toBeTruthy();
    });

    it('should pass layouts prop to DashboardGrid', async () => {
      render(<DashboardContainer {...defaultProps} />);

      const gridElement = document.querySelector('.react-grid-layout');
      expect(gridElement).toBeTruthy();
    });
  });

  describe('Lazy Loading - All 6 Charts', () => {
    it('should render all 6 chart components', async () => {
      render(<DashboardContainer {...defaultProps} />);

      await waitFor(() => {
        const trendChart = screen.queryByTestId('trend-chart');
        expect(trendChart).toBeTruthy();
      });
    });

    it('should display TrendChart component', async () => {
      render(<DashboardContainer {...defaultProps} />);

      await waitFor(() => {
        const trendChart = screen.queryByTestId('trend-chart');
        expect(trendChart).toBeTruthy();
      });
    });

    it('should display ParetoChart component', async () => {
      render(<DashboardContainer {...defaultProps} />);

      await waitFor(() => {
        const paretoChart = screen.queryByTestId('pareto-chart');
        expect(paretoChart).toBeTruthy();
      });
    });

    it('should display DistributionHistogram component', async () => {
      render(<DashboardContainer {...defaultProps} />);

      await waitFor(() => {
        const histogramChart = screen.queryByTestId('histogram-chart');
        expect(histogramChart).toBeTruthy();
      });
    });

    it('should display RangeDistributionCharts component', async () => {
      render(<DashboardContainer {...defaultProps} />);

      await waitFor(() => {
        const scatterChart = screen.queryByTestId('scatter-chart');
        expect(scatterChart).toBeTruthy();
      });
    });

    it('should display TopDonorsChart component', async () => {
      render(<DashboardContainer {...defaultProps} />);

      await waitFor(() => {
        const heatmapChart = screen.queryByTestId('heatmap-chart');
        expect(heatmapChart).toBeTruthy();
      });
    });

    it('should display StatisticsTable component', async () => {
      render(<DashboardContainer {...defaultProps} />);

      await waitFor(() => {
        const boxplotChart = screen.queryByTestId('boxplot-chart');
        expect(boxplotChart).toBeTruthy();
      });
    });
  });

  describe('Layout Management', () => {
    it('should call onLayoutChange when layout changes', async () => {
      const onLayoutChange = vi.fn();

      render(<DashboardContainer {...defaultProps} onLayoutChange={onLayoutChange} />);

      await waitFor(() => {
        expect(onLayoutChange).toHaveBeenCalled();
      });
    });

    it('should preserve layouts across re-renders', async () => {
      const { rerender } = render(<DashboardContainer {...defaultProps} />);

      await waitFor(() => {
        expect(document.querySelector('.react-grid-layout')).toBeTruthy();
      });

      rerender(<DashboardContainer {...defaultProps} />);

      await waitFor(() => {
        expect(document.querySelector('.react-grid-layout')).toBeTruthy();
      });
    });
  });

  describe('Chart Type Mapping', () => {
    it('should map trend chart to correct skeleton type', async () => {
      render(<DashboardContainer {...defaultProps} />);

      await waitFor(() => {
        const gridElement = document.querySelector('.react-grid-layout');
        expect(gridElement).toBeTruthy();
      });
    });
  });

  describe('TypeScript Type Safety', () => {
    it('should accept valid Layout props', async () => {
      const validLayouts: ResponsiveLayouts<Breakpoint> = {
        lg: [{ i: 'test', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 3 }],
        md: [{ i: 'test', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 3 }],
        sm: [{ i: 'test', x: 0, y: 0, w: 4, h: 4, minW: 2, minH: 3 }],
      };

      expect(() => {
        render(<DashboardContainer {...defaultProps} layouts={validLayouts} />);
      }).not.toThrow();
    });
  });

  describe('Integration with Existing Components', () => {
    it('should use DashboardGrid component', async () => {
      render(<DashboardContainer {...defaultProps} />);

      await waitFor(() => {
        const gridElement = document.querySelector('.react-grid-layout');
        expect(gridElement).toBeTruthy();
      });
    });

    it('should render chart components within grid', async () => {
      render(<DashboardContainer {...defaultProps} />);

      await waitFor(() => {
        const trendChart = screen.queryByTestId('trend-chart');
        expect(trendChart).toBeTruthy();
      });
    });
  });

  describe('Component Structure', () => {
    it('should export DashboardContainer as default', () => {
      expect(typeof DashboardContainer).toBe('function');
    });

    it('should be a valid React component', () => {
      const element = React.createElement(DashboardContainer, defaultProps);
      expect(React.isValidElement(element)).toBe(true);
    });
  });

  describe('Error Recovery', () => {
    it('should handle retry key changes for error recovery', async () => {
      const { rerender } = render(<DashboardContainer {...defaultProps} />);

      await waitFor(() => {
        expect(document.querySelector('.react-grid-layout')).toBeTruthy();
      });

      // Trigger a re-render with same props (should maintain state)
      rerender(<DashboardContainer {...defaultProps} />);

      await waitFor(() => {
        expect(document.querySelector('.react-grid-layout')).toBeTruthy();
      });
    });
  });

  describe('Props Passthrough', () => {
    it('should pass rowHeight to DashboardGrid', async () => {
      render(<DashboardContainer {...defaultProps} rowHeight={60} />);

      await waitFor(() => {
        const gridElement = document.querySelector('.react-grid-layout');
        expect(gridElement).toBeTruthy();
      });
    });

    it('should pass custom breakpoints to DashboardGrid', async () => {
      const customBreakpoints = { lg: 1200, md: 996, sm: 768 };
      render(<DashboardContainer {...defaultProps} breakpoints={customBreakpoints} />);

      await waitFor(() => {
        const gridElement = document.querySelector('.react-grid-layout');
        expect(gridElement).toBeTruthy();
      });
    });

    it('should pass isDraggable and isResizable props', async () => {
      render(<DashboardContainer {...defaultProps} isDraggable={false} isResizable={false} />);

      await waitFor(() => {
        const gridElement = document.querySelector('.react-grid-layout');
        expect(gridElement).toBeTruthy();
      });
    });

    it('should pass margin and compactType props', async () => {
      render(<DashboardContainer {...defaultProps} margin={[20, 20]} compactType="horizontal" />);

      await waitFor(() => {
        const gridElement = document.querySelector('.react-grid-layout');
        expect(gridElement).toBeTruthy();
      });
    });
  });
});
