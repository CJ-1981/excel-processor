/**
 * ChartSkeleton Component
 *
 * Loading placeholder component for chart modules during lazy loading.
 * Provides skeleton UI that matches chart dimensions for smooth UX.
 */

import React from 'react';
import { Box, Skeleton, useTheme } from '@mui/material';

export type ChartType = 'trend' | 'pareto' | 'histogram' | 'scatter' | 'heatmap' | 'boxplot';

export interface ChartSkeletonProps {
  chartType: ChartType;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

const DEFAULT_HEIGHT = 300;

const ChartSkeleton: React.FC<ChartSkeletonProps> = ({
  chartType,
  height = DEFAULT_HEIGHT,
  className,
  style,
}) => {
  const theme = useTheme();

  // Shared skeleton styles for DRY principle
  const axisSx = { position: 'absolute' as const, left: 0, top: 0 };
  const xAxisSx = { position: 'absolute' as const, bottom: 0, left: 40 };
  const chartAreaSx = {
    position: 'absolute' as const,
    top: 10,
    left: 45,
    animation: 'pulse 1.5s ease-in-out infinite' as const,
  };

  // Render skeleton structure based on chart type
  const renderSkeletonContent = () => {
    switch (chartType) {
      case 'pareto':
        return (
          <>
            {/* Left Y-axis placeholder */}
            <Skeleton variant="rectangular" width={40} height="100%" sx={axisSx} />
            {/* Right Y-axis placeholder */}
            <Skeleton variant="rectangular" width={40} height="100%" sx={{ position: 'absolute' as const, right: 0, top: 0 }} />
            {/* X-axis placeholder */}
            <Skeleton variant="rectangular" height={50} width="calc(100% - 80px)" sx={xAxisSx} />
            {/* Bar chart placeholder */}
            <Skeleton variant="rectangular" width="calc(100% - 90px)" height="calc(100% - 60px)" sx={chartAreaSx} />
          </>
        );

      case 'trend':
      case 'histogram':
      case 'scatter':
      case 'heatmap':
      case 'boxplot':
        return (
          <>
            {/* Y-axis placeholder */}
            <Skeleton variant="rectangular" width={40} height="100%" sx={axisSx} />
            {/* X-axis placeholder */}
            <Skeleton variant="rectangular" height={30} width="calc(100% - 40px)" sx={xAxisSx} />
            {/* Chart area placeholder */}
            <Skeleton variant="rectangular" width="calc(100% - 50px)" height="calc(100% - 40px)" sx={chartAreaSx} />
          </>
        );

      default:
        // Default skeleton for unknown chart types
        return (
          <Skeleton
            variant="rectangular"
            width="100%"
            height="100%"
            sx={{ animation: 'pulse 1.5s ease-in-out infinite' }}
          />
        );
    }
  };

  return (
    <Box
      className={className}
      sx={{
        width: '100%',
        height: `${height}px`,
        position: 'relative',
        backgroundColor: theme.palette.background.paper,
        borderRadius: 1,
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Accessible loading announcement */}
      <Box
        role="status"
        aria-live="polite"
        sx={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
        }}
      >
        Loading {chartType} chart...
      </Box>

      {renderSkeletonContent()}
    </Box>
  );
};

export default ChartSkeleton;
