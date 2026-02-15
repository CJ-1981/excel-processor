/**
 * TopDonorsChart Component
 * Bar chart showing top N donors by contribution amount
 */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Customized,
} from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import type { CategoryDistribution } from '../../types/chart';
import { formatCompactNumber, formatTooltipValue } from '../../utils/chartCalculations';
import { getChartColors } from '../../utils/colorUtils';

export interface TopDonorsChartProps {
  data: CategoryDistribution[];
  valueLabel: string;
  limit?: number;
  anonymize?: boolean;
  isLoading?: boolean;
  error?: Error;
  onExport?: (format: 'png' | 'jpg') => void;
  className?: string;
}

interface TooltipPayload {
  payload: {
    name: string;
    value: number;
    count: number;
    percentage: number;
  };
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
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
        <Typography variant="body2" sx={{ color: payload[0].color }}>
          Value: {formatTooltipValue(data.value)}
        </Typography>
        <Typography variant="body2" sx={{ color: payload[0].color }}>
          Count: {data.count}
        </Typography>
        <Typography variant="body2" sx={{ color: payload[0].color }}>
          Percentage: {data.percentage.toFixed(1)}%
        </Typography>
      </Box>
    );
  }
  return null;
};

const TopDonorsChart: React.FC<TopDonorsChartProps> = ({
  data,
  valueLabel,
  limit = 10,
  anonymize = false,
  isLoading = false,
  error,
}) => {
  const theme = useTheme();
  const COLORS = getChartColors();
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

  const chartData = data.slice(0, limit).map((item) => ({
    name: item.category,
    value: item.value,
    count: item.count,
    percentage: item.percentage,
  }));

  if (isLoading) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          minHeight: 300,
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
          width: '100%',
          height: '100%',
          minHeight: 300,
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

  if (data.length === 0) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          minHeight: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No data available
        </Typography>
      </Box>
    );
  }

  const gridColor = theme.palette.divider;

  const renderInlineLegend = ({ width, margin }: { width?: number; margin?: { top?: number; right?: number; bottom?: number; left?: number } }) => {
    const padding = 6;
    const boxSize = 12;
    const gap = 6;
    const label = valueLabel || 'Value';

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

    const labelPx = measure(label);
    const legendWidth = Math.min(280, padding * 2 + boxSize + gap + labelPx);
    const legendHeight = padding * 2 + boxSize;
    const m = margin || { top: 0, right: 0, bottom: 0, left: 0 };
    const innerLeft = m.left || 0;
    const innerTop = m.top || 0;
    const effectiveWidth = typeof width === 'number' && width > 0 ? width : containerSize.width || 400;
    const innerRight = effectiveWidth - (m.right || 0);
    const inset = 8;
    const startX = Math.max(innerLeft + inset, innerRight - legendWidth - inset);
    const startY = Math.max(innerTop + inset, innerTop + inset);
    const color = COLORS[0];

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
          stroke={gridColor}
        />
        <rect x={startX + padding} y={startY + padding} width={boxSize} height={boxSize} fill={color} stroke={color} />
        <text
          x={startX + padding + boxSize + gap}
          y={startY + padding + boxSize - 1}
          fill={theme.palette.text.primary}
          fontSize={12}
          alignmentBaseline="baseline"
        >
          {label}
        </text>
      </g>
    );
  };

  return (
    <Box
      ref={containerRef}
      sx={{ width: '100%', height: '100%', display: 'flex' }}
      data-chart-id="top-contributors"
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
        <BarChart
          data={chartData}
          layout="horizontal"
          margin={{ top: 16, right: 30, left: 40, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="name"
            stroke={theme.palette.text.primary}
            tick={{ fill: theme.palette.text.primary, fontSize: '12px' }}
            angle={-45}
            textAnchor="end"
            height={100}
            interval={anonymize ? 0 : undefined}
            tickFormatter={
              anonymize
                ? ((_value: unknown, index: number) => {
                    const n = chartData.length;
                    const step = n > 40 ? 10 : n > 20 ? 5 : n > 10 ? 2 : 1;
                    return index % step === 0 ? String(index + 1) : '';
                  })
                : undefined
            }
          />
          <YAxis stroke={theme.palette.text.primary} tick={{ fill: theme.palette.text.primary }} tickFormatter={(value) => formatCompactNumber(value)} />
          <Tooltip content={(props: any) => CustomTooltip(props)} />
          <Customized component={renderInlineLegend} />
          <Bar dataKey="value" name={valueLabel}>
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default TopDonorsChart;
