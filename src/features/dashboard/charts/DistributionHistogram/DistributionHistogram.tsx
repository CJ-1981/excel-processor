/**
 * DistributionHistogram Component
 * Frequency distribution histogram with configurable bins
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
  ReferenceLine,
  Cell,
  Customized,
} from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import type { HistogramData } from '../../types/chart';
import { formatCurrencyGerman } from '../../../utils/germanFormatter';

export interface DistributionHistogramProps {
  data: HistogramData;
  valueLabel?: string;
  color?: string;
  isLoading?: boolean;
  error?: Error;
  onExport?: (format: 'png' | 'jpg') => void;
  className?: string;
}

const DistributionHistogram: React.FC<DistributionHistogramProps> = ({
  data,
  color,
  isLoading = false,
  error,
}) => {
  const theme = useTheme();
  const chartColor = color || theme.palette.primary.main;
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
        const cr = entry.contentRect;
        setContainerSize({ width: Math.round(cr.width || 0), height: Math.round(cr.height || 0) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', height: '100%', py: 8, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Loading histogram...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ width: '100%', height: '100%', py: 8, textAlign: 'center' }}>
        <Typography variant="body2" color="error">
          Error loading histogram: {error.message}
        </Typography>
      </Box>
    );
  }

  if (data.bins.length === 0) {
    return (
      <Box sx={{ width: '100%', height: '100%', py: 8, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No data available for histogram
        </Typography>
      </Box>
    );
  }

  const maxCount = Math.max(...data.bins.map((b) => b.count));
  const yAxisMax = Math.ceil(maxCount * 1.1);

  const renderInlineLegend = ({ width, margin }: { width?: number; margin?: { top?: number; right?: number; bottom?: number; left?: number } }) => {
    const padding = 6;
    const swatchSize = 12;
    const gap = 6;
    const items = [
      { type: 'box', label: 'Count', color: chartColor },
      { type: 'line', label: 'Mean', color: theme.palette.error.main, dashed: true },
      { type: 'line', label: 'Median', color: theme.palette.warning.main, dashed: true },
    ];

    const measure = (text: string) => {
      try {
        const c = document.createElement('canvas');
        const ctx = c.getContext('2d');
        if (ctx) {
          ctx.font = '12px sans-serif';
          return Math.ceil(ctx.measureText(text).width);
        }
      } catch {
        // Ignore
      }
      return text.length * 8;
    };

    const rowHeight = 16;
    const legendWidth = Math.min(320, padding * 2 + Math.max(...items.map((it) => swatchSize + gap + measure(it.label))));
    const legendHeight = padding * 2 + items.length * rowHeight + (items.length - 1) * 4;

    const m = margin || { top: 0, right: 0, bottom: 0, left: 0 };
    const effectiveWidth = typeof width === 'number' && width > 0 ? width : containerSize.width || 400;
    const innerRight = effectiveWidth - (m.right || 0);
    const inset = 8;
    const startX = Math.max((m.left || 0) + inset, innerRight - legendWidth - inset);
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
        {items.map((it, idx) => {
          const y = startY + padding + idx * (rowHeight + 4);
          return (
            <g key={it.label}>
              {it.type === 'box' ? (
                <rect x={startX + padding} y={y + 2} width={swatchSize} height={swatchSize} fill={it.color} stroke={it.color} />
              ) : (
                <g>
                  <line
                    x1={startX + padding}
                    x2={startX + padding + swatchSize}
                    y1={y + 8}
                    y2={y + 8}
                    stroke={it.color}
                    strokeWidth={2}
                    strokeDasharray={it.dashed ? '5 5' : undefined}
                  />
                </g>
              )}
              <text
                x={startX + padding + swatchSize + gap}
                y={y + 12}
                fill={theme.palette.text.primary}
                fontSize={12}
                alignmentBaseline="baseline"
              >
                {it.label}
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  return (
    <Box ref={containerRef} sx={{ width: '100%', height: '100%', display: 'flex' }} data-chart-id="histogram">
      <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
        <BarChart data={data.bins} margin={{ top: 24, right: 30, left: 28, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            stroke={theme.palette.text.secondary}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke={theme.palette.text.secondary}
            domain={[0, yAxisMax]}
            label={{
              value: 'Count',
              angle: -90,
              position: 'insideLeft',
              style: { textAnchor: 'middle', fill: theme.palette.text.secondary },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: theme.shape.borderRadius,
            }}
            formatter={(value: number | undefined, name: string | undefined) => [value ?? 0, name === 'count' ? 'Count' : name ?? '']}
            labelFormatter={(label) => `Range: ${label}`}
          />
          <Customized component={renderInlineLegend} />
          <Bar dataKey="count" name="count" fill={chartColor} radius={[4, 4, 0, 0]}>
            {data.bins.map((_, index) => (
              <Cell key={`cell-${index}`} fill={chartColor} fillOpacity={0.8} />
            ))}
          </Bar>

          <ReferenceLine
            x={data.bins.find((bin) => data.mean >= bin.binStart && data.mean <= bin.binEnd)?.label}
            stroke={theme.palette.error.main}
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{
              value: `Mean: ${formatCurrencyGerman(data.mean)}`,
              position: 'insideTopRight',
              fill: theme.palette.error.main,
              fontSize: 11,
            }}
          />

          <ReferenceLine
            x={data.bins.find((bin) => data.median >= bin.binStart && data.median <= bin.binEnd)?.label}
            stroke={theme.palette.warning.main}
            strokeDasharray="3 3"
            strokeWidth={2}
            label={{
              value: `Median: ${formatCurrencyGerman(data.median)}`,
              position: 'insideTopRight',
              fill: theme.palette.warning.main,
              fontSize: 11,
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default DistributionHistogram;
