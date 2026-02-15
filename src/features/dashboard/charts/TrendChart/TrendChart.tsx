/**
 * TrendChart Component
 * Multi-series time series chart with line, area, and stacked visualization options
 */

import React from 'react';
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
import { formatTooltipValue } from '../../utils/chartCalculations';

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

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
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
            {entry.name}: {formatTooltipValue(entry.value)}
          </Typography>
        ))}
      </Box>
    );
  }
  return null;
};

const TrendChart: React.FC<TrendChartProps> = ({
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

  // All hooks must be called before any early returns
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = React.useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect as DOMRectReadOnly;
        setContainerSize({ width: Math.round(cr.width || 0), height: Math.round(cr.height || 0) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const formatTooltipValue = (value: number): string => {
    if (value === 0) return '0.00';
    if (Math.abs(value) >= 1000000) {
      return (value / 1000000).toFixed(2) + 'M';
    }
    if (Math.abs(value) >= 1000) {
      return (value / 1000).toFixed(2) + 'K';
    }
    return value.toFixed(2);
  };

  const chartData = data.map((point) => ({
    ...point,
  }));

  const ChartComponent = chartType === 'line' ? LineChart : AreaChart;

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

  if (data.length === 0 || series.length === 0) {
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

  const renderSeries = () => {
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
  };

  const renderInlineLegend = ({ width, margin }: { width?: number; margin?: { top?: number; right?: number; bottom?: number; left?: number } }) => {
    const itemHeight = 16;
    const padding = 6;
    const gap = 6;

    const measure = (text: string) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.font = '12px sans-serif';
          return Math.ceil(ctx.measureText(text).width);
        }
      } catch {
        // Ignore
      }
      return text.length * 8;
    };

    const maxLabelPx = Math.max(0, ...series.map((s) => measure(s.label)));
    const legendWidth = Math.min(280, 12 + 6 + maxLabelPx + padding * 2);
    const legendHeight = padding * 2 + series.length * itemHeight + (series.length - 1) * gap;
    const m = margin || { top: 0, right: 0, bottom: 0, left: 0 };
    const effectiveWidth = typeof width === 'number' && width > 0 ? width : containerSize.width || 400;
    const innerRight = effectiveWidth - (m.right || 0);
    const inset = 8;
    const startX = Math.max(m.left || 0 + inset, innerRight - legendWidth - inset);
    const startY = (m.top || 0) + inset;

    return (
      <g>
        <rect
          x={startX}
          y={startY}
          width={legendWidth}
          height={legendHeight}
          rx={6}
          ry={6}
          fill="#fff"
          fillOpacity={0.85}
          stroke={theme.palette.divider}
        />
        {series.map((s, idx) => {
          const y = startY + padding + idx * (itemHeight + gap);
          return (
            <g key={s.key}>
              <rect x={startX + padding} y={y + 2} width={12} height={12} fill={s.color} stroke={s.color} />
              <text
                x={startX + padding + 12 + 6}
                y={y + 12}
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
  };

  return (
    <Box ref={containerRef} sx={{ width: '100%', height: '100%' }} data-chart-id="trend-chart">
      <ResponsiveContainer width="100%" height="100%" debounce={1}>
        <ChartComponent data={chartData} margin={{ top: 16, right: 30, left: 40, bottom: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="period"
            stroke={theme.palette.text.primary}
            tick={{ fill: theme.palette.text.primary, fontSize: 12 }}
            tickLine={{ stroke: theme.palette.text.secondary }}
          />
          <YAxis
            stroke={theme.palette.text.primary}
            tick={{ fill: theme.palette.text.primary, fontSize: 12 }}
            tickFormatter={(value: unknown) => formatTooltipValue(value as number)}
          />
          <Tooltip content={(props: any) => CustomTooltip(props)} />
          <Customized component={renderInlineLegend} />
          {renderSeries()}
        </ChartComponent>
      </ResponsiveContainer>
    </Box>
  );
};

export default TrendChart;
