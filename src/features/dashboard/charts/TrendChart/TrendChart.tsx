/**
 * TrendChart Component
 * Multi-series time series chart with line, area, and stacked visualization options
 * Optimized with React.memo to prevent unnecessary re-renders
 */

import React, { useCallback, useMemo, memo } from 'react';

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Customized,
} from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import type { MultiSeriesDataPoint, SeriesConfig, ChartType, PeriodType } from '../../types/chart';

interface TooltipPayload {
  color: string;
  name: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label: string;
}

// Custom XAxis tick component for rendering multi-line labels (week + date)
interface CustomAxisTickProps {
  x?: number;
  y?: number;
  payload?: {
    value: string;
  };
}

const CustomAxisTick: React.FC<CustomAxisTickProps> = ({ x, y, payload }) => {
  if (!payload || !x || !y) return null;

  const label = payload.value;
  const newlineIndex = label.indexOf('\n');

  if (newlineIndex !== -1) {
    const week = label.substring(0, newlineIndex);
    const date = label.substring(newlineIndex + 1);
    // Use dy offset for second line
    return (
      <text x={x} y={y} textAnchor="middle" fontSize={11} fill="currentColor">
        {week}
        <tspan textAnchor="middle" dy="14" fontSize={9} fill="currentColor" opacity={0.7}>
          {date}
        </tspan>
      </text>
    );
  }

  return (
    <text x={x} y={y} dy="0.4em" textAnchor="middle" fontSize={11} fill="currentColor">
      {label}
    </text>
  );
};

// Local formatter function (outside component to avoid recreation)
const formatValue = (value: number): string => {
  if (value === 0) return '0.00';
  if (Math.abs(value) >= 1000000) {
    return (value / 1000000).toFixed(2) + 'M';
  }
  if (Math.abs(value) >= 1000) {
    return (value / 1000).toFixed(2) + 'K';
  }
  return value.toFixed(2);
};

// Memoized CustomTooltip component
const CustomTooltip = memo(({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          p: 1.5,
          boxShadow: 3,
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
          {label}
        </Typography>
        {payload.map((entry, index) => (
          <Typography
            key={index}
            variant="body2"
            sx={{ color: entry.color, fontSize: '0.875rem' }}
          >
            {entry.name}: {formatValue(entry.value)}
          </Typography>
        ))}
      </Box>
    );
  }
  return null;
});

CustomTooltip.displayName = 'CustomTooltip';

export interface TrendChartProps {
  data: MultiSeriesDataPoint[];
  series: SeriesConfig[];
  periodType: PeriodType;
  type?: ChartType;
  isLoading?: boolean;
  error?: Error;
  onExport?: (format: 'png' | 'jpg') => void;
  className?: string;
}

const TrendChartInner: React.FC<TrendChartProps> = ({
  data,
  series,
  type = 'area',
  isLoading = false,
  error,
}) => {
  const theme = useTheme();
  const gridColor = theme.palette.divider;
  const isStacked = type === 'stacked';
  const chartType = isStacked ? 'area' : type;

  const ChartComponent = chartType === 'line' ? LineChart : AreaChart;

  // Memoize computed values
  const shouldRender = useMemo(() => {
    return !isLoading && !error && data.length > 0 && series.length > 0;
  }, [isLoading, error, data.length, series.length]);

  // Memoize series rendering
  const renderSeries = useMemo(() => {
    return series.map((s) => {
      const color = s.color;

      if (chartType === 'line') {
        return (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, r: 3 }}
            activeDot={{ r: 5 }}
          />
        );
      }

      return (
        <Area
          key={s.key}
          type="monotone"
          dataKey={s.key}
          name={s.label}
          stroke={color}
          strokeWidth={2}
          fill={color}
          fillOpacity={isStacked ? 0.8 : 0.3}
          stackId={isStacked ? 'stack' : undefined}
        />
      );
    });
  }, [series, chartType, isStacked]);

  // Memoize inline legend rendering - position in right-top corner
  const renderInlineLegend = useCallback(() => {
    const itemHeight = 16;
    const padding = 6;
    const gap = 6;

    // Position legend content at 85% from left
    const legendXPercent = 85;
    const startY = 16;

    return (
      <g>
        {series.map((s, idx) => {
          const y = startY + padding + idx * (itemHeight + gap);
          return (
            <g key={s.key}>
              <rect
                x={`${legendXPercent}%`}
                y={y + 2}
                width={12}
                height={12}
                fill={s.color}
                stroke={s.color}
                dx={padding}
              />
              <text
                x={`${legendXPercent}%`}
                y={y + 12}
                dx={padding + 12 + gap}
                fill={theme.palette.text.primary}
                fontSize={12}
                alignmentBaseline="baseline"
              >
                {s.label}
              </text>
            </g>
          );
        })}
      </g>
    );
  }, [series, theme.palette.text.primary]);

  // Loading state
  if (isLoading) {
    return (
      <Box
        sx={{
          height: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Loading chart data...
        </Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box
        sx={{
          height: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="body2" color="error">
          Error loading chart: {error.message}
        </Typography>
      </Box>
    );
  }

  // Empty state
  if (!shouldRender) {
    return (
      <Box
        sx={{
          height: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No data available for the selected period
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }} data-chart-id="trend-chart">
      <ResponsiveContainer width="100%" height="100%" debounce={1}>
        <ChartComponent data={data} margin={{ top: 16, right: 120, left: 40, bottom: 50 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="period"
            stroke={theme.palette.text.primary}
            tick={<CustomAxisTick />}
            tickLine={{ stroke: theme.palette.text.secondary }}
            height={50}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke={theme.palette.text.primary}
            tick={{ fill: theme.palette.text.primary, fontSize: 12 }}
            tickFormatter={(value: unknown) => formatValue(value as number)}
          />
          <Tooltip content={(props: any) => <CustomTooltip {...props} />} />
          <Customized component={renderInlineLegend} />
          {renderSeries}
        </ChartComponent>
      </ResponsiveContainer>
    </Box>
  );
};

// Memoize the main component with custom comparison
const TrendChart = memo(TrendChartInner, (prevProps, nextProps) => {
  return (
    prevProps.data === nextProps.data &&
    prevProps.series === nextProps.series &&
    prevProps.periodType === nextProps.periodType &&
    prevProps.type === nextProps.type &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.error === nextProps.error
  );
});

TrendChart.displayName = 'TrendChart';

export default TrendChart;
export { TrendChart };
