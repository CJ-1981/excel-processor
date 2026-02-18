/**
 * DashboardContainer Component
 *
 * Main dashboard container that implements lazy loading for all chart modules.
 * Uses React.lazy for code splitting and Suspense with ChartSkeleton for loading states.
 * Integrates ChartErrorBoundary for error recovery with retry functionality.
 *
 * Performance Features:
 * - On-demand loading: Charts load only when needed
 * - Code splitting: Separate chunks for each chart module
 * - Graceful recovery: ChunkLoadError handling with retry
 * - Responsive layout: Uses DashboardGrid with ResponsiveGridLayout
 *
 * @see SPEC-PERF-DASHBOARD-002 TASK-012
 */

import React, { Suspense, Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Box } from '@mui/material';
import DashboardGrid from './components/DashboardGrid';
import ChartErrorBoundary from './components/ChartErrorBoundary';
import ChartSkeleton from './components/ChartSkeleton';
import type { ResponsiveLayouts, Breakpoint } from 'react-grid-layout';
import type { ChartType } from './components/ChartSkeleton';

/**
 * Lazy-loaded chart modules using React.lazy
 * Each chart is loaded on-demand from separate chunks
 */
const TrendChart = React.lazy(() => import('./charts/TrendChart'));
const ParetoChart = React.lazy(() => import('./charts/ParetoChart'));
const DistributionHistogram = React.lazy(() => import('./charts/DistributionHistogram'));
const RangeDistributionCharts = React.lazy(() => import('./charts/RangeDistributionCharts'));
const TopDonorsChart = React.lazy(() => import('./charts/TopDonorsChart'));
const StatisticsTable = React.lazy(() => import('./charts/StatisticsTable'));

/**
 * Chart metadata for skeleton type mapping
 */
interface ChartMetadata {
  id: string;
  component: React.ComponentType<any>;
  skeletonType: ChartType;
  defaultProps?: Record<string, unknown>;
}

/**
 * Chart configuration mapping
 * Maps chart IDs to their lazy components and skeleton types
 */
const CHART_CONFIG: ChartMetadata[] = [
  {
    id: 'trend',
    component: TrendChart,
    skeletonType: 'trend',
  },
  {
    id: 'pareto',
    component: ParetoChart,
    skeletonType: 'pareto',
  },
  {
    id: 'histogram',
    component: DistributionHistogram,
    skeletonType: 'histogram',
  },
  {
    id: 'scatter',
    component: RangeDistributionCharts,
    skeletonType: 'scatter',
  },
  {
    id: 'heatmap',
    component: TopDonorsChart,
    skeletonType: 'heatmap',
  },
  {
    id: 'boxplot',
    component: StatisticsTable,
    skeletonType: 'boxplot',
  },
];

export interface DashboardContainerProps {
  /**
   * Responsive layouts for different breakpoints
   */
  layouts: ResponsiveLayouts<Breakpoint>;

  /**
   * Callback when layout changes
   */
  onLayoutChange: (currentLayout: any, allLayouts: ResponsiveLayouts<Breakpoint>) => void;

  /**
   * Callback when breakpoint changes
   */
  onBreakpointChange?: (breakpoint: Breakpoint, cols: number) => void;

  /**
   * Custom className for the grid container
   */
  className?: string;

  /**
   * Custom style for the grid container
   */
  style?: React.CSSProperties;

  /**
   * Row height for grid items
   */
  rowHeight?: number;

  /**
   * Custom breakpoints
   */
  breakpoints?: Record<string, number>;

  /**
   * Number of columns per breakpoint
   */
  cols?: Record<string, number>;

  /**
   * Margin between grid items [x, y]
   */
  margin?: [number, number];

  /**
   * Compact type: vertical, horizontal, or null
   */
  compactType?: 'vertical' | 'horizontal' | null;

  /**
   * Prevent collision when dragging
   */
  preventCollision?: boolean;

  /**
   * Measure container before mounting
   */
  measureBeforeMount?: boolean;

  /**
   * Enable drag functionality
   */
  isDraggable?: boolean;

  /**
   * Enable resize functionality
   */
  isResizable?: boolean;
}

/**
 * Error boundary state for retry functionality
 */
interface ChartErrorState {
  hasError: boolean;
  error: Error | null;
  retryKey: number;
}

/**
 * Individual chart wrapper with error boundary and suspense
 */
interface LazyChartWrapperProps {
  metadata: ChartMetadata;
  retryKey: number;
}

/**
 * LazyChartWrapper wraps each chart with ErrorBoundary and Suspense
 * Handles chunk loading errors and displays skeleton during loading
 */
class LazyChartWrapper extends Component<LazyChartWrapperProps, ChartErrorState> {
  constructor(props: LazyChartWrapperProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryKey: props.retryKey,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ChartErrorState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`[DashboardContainer] Error in ${this.props.metadata.id}:`, error, {
      componentStack: errorInfo.componentStack,
    });
  }

  handleRetry = (): void => {
    // Increment retry key to force remount of the lazy component
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      retryKey: prevState.retryKey + 1,
    }));
  };

  render(): ReactNode {
    const { metadata, retryKey } = this.props;
    const { hasError, error } = this.state;
    const { component: Component, skeletonType, defaultProps } = metadata;

    if (hasError && error) {
      return (
        <ChartErrorBoundary onRetry={this.handleRetry}>
          <Box
            sx={{
              height: 300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Error loading {metadata.id}
          </Box>
        </ChartErrorBoundary>
      );
    }

    return (
      <ChartErrorBoundary onRetry={this.handleRetry} key={retryKey}>
        <Suspense fallback={<ChartSkeleton chartType={skeletonType} height={300} />}>
          <Component {...defaultProps} />
        </Suspense>
      </ChartErrorBoundary>
    );
  }
}

/**
 * DashboardContainer Component
 *
 * Main container that manages lazy-loaded chart components with:
 * - React.lazy for code splitting
 * - Suspense with ChartSkeleton for loading states
 * - ChartErrorBoundary for error recovery
 * - DashboardGrid for responsive layout
 */
const DashboardContainer: React.FC<DashboardContainerProps> = ({
  layouts,
  onLayoutChange,
  onBreakpointChange,
  className,
  style,
  rowHeight,
  breakpoints,
  cols,
  margin,
  compactType,
  preventCollision,
  measureBeforeMount,
  isDraggable,
  isResizable,
}) => {
  // Global retry key for all charts (starts at 0, incremented by LazyChartWrapper on retry)
  const [globalRetryKey] = React.useState(0);

  return (
    <DashboardGrid
      layouts={layouts}
      onLayoutChange={onLayoutChange}
      onBreakpointChange={onBreakpointChange}
      className={className}
      style={style}
      rowHeight={rowHeight}
      breakpoints={breakpoints}
      cols={cols}
      margin={margin}
      compactType={compactType}
      preventCollision={preventCollision}
      measureBeforeMount={measureBeforeMount}
      isDraggable={isDraggable}
      isResizable={isResizable}
    >
      {CHART_CONFIG.map((metadata) => (
        <div key={`${metadata.id}-${globalRetryKey}`} data-grid={layouts.lg?.find((l) => l.i === metadata.id)}>
          <LazyChartWrapper metadata={metadata} retryKey={globalRetryKey} />
        </div>
      ))}
    </DashboardGrid>
  );
};

export default DashboardContainer;
