/**
 * DistributionHistogram Component
 * Frequency distribution histogram with configurable bins
 * Optimized with React.memo to prevent unnecessary re-renders
 */

import React, { useMemo, useCallback, memo } from 'react';
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
import { formatCurrencyGerman } from '../../../../utils/germanFormatter';

export interface DistributionHistogramProps {
  data: HistogramData;
  valueLabel?: string;
  color?: string;
  isLoading?: boolean;
  error?: Error;
  onExport?: (format: 'png' | 'jpg') => void;
  className?: string;
}

const DistributionHistogramInner: React.FC<DistributionHistogramProps> = ({
  data,
  color,
  isLoading = false,
  error,
}) => {
  const theme = useTheme();
  const chartColor = color || theme.palette.primary.main;

  // Memoize computed values
  const { yAxisMax, meanBinLabel, medianBinLabel } = useMemo(() => {
    const maxCount = Math.max(...data.bins.map((b) => b.count));
    const max = Math.ceil(maxCount * 1.1);
    const meanLabel = data.bins.find((bin) => data.mean >= bin.binStart && data.mean <= bin.binEnd)?.label;
    const medianLabel = data.bins.find((bin) => data.median >= bin.binStart && data.median <= bin.binEnd)?.label;
    return { yAxisMax: max, meanBinLabel: meanLabel, medianBinLabel: medianLabel };
  }, [data.bins, data.mean, data.median]);

  // Memoize should render check
  const shouldRender = useMemo(() => {
    return !isLoading && !error && data.bins.length > 0;
  }, [isLoading, error, data.bins.length]);

  // Memoize inline legend rendering - position in right-top corner using SVG percentage
  const renderInlineLegend = useCallback((props: any) => {
    const padding = 6;
    const swatchSize = 12;
    const gap = 6;
    const items = [
      { type: 'box', label: 'Count', color: chartColor },
      { type: 'line', label: 'Mean', color: theme.palette.error.main, dashed: true },
      { type: 'line', label: 'Median', color: theme.palette.warning.main, dashed: true },
    ];

    const rowHeight = 16;
    const legendXPercent = 85;
    const startY = 16;
    const { width = 600 } = props;
    const xOffset = (width * legendXPercent) / 100;

    return (
      <g>
        {items.map((it, idx) => {
          const y = startY + padding + idx * (rowHeight + 4);
          return (
            <g key={it.label}>
              {it.type === 'box' ? (
                <rect
                  x={xOffset}
                  y={y + 2}
                  width={swatchSize}
                  height={swatchSize}
                  fill={it.color}
                  stroke={it.color}
                />
              ) : (
                <line
                  x1={xOffset + padding}
                  x2={xOffset + padding + swatchSize}
                  y1={y + 8}
                  y2={y + 8}
                  stroke={it.color}
                  strokeWidth={2}
                  strokeDasharray={it.dashed ? '5 5' : undefined}
                />
              )}
              <text
                x={xOffset}
                y={y + 12}
                dx={swatchSize + gap}
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
  }, [chartColor, theme.palette.text.primary, theme.palette.error.main, theme.palette.warning.main]);

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ width: '100%', height: '100%', py: 8, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Loading histogram...
        </Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ width: '100%', height: '100%', py: 8, textAlign: 'center' }}>
        <Typography variant="body2" color="error">
          Error loading histogram: {error.message}
        </Typography>
      </Box>
    );
  }

  // Empty state
  if (!shouldRender) {
    return (
      <Box sx={{ width: '100%', height: '100%', py: 8, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No data available for histogram
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex' }} data-chart-id="histogram">
      <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
        <BarChart data={data.bins} margin={{ top: 24, right: 100, left: 28, bottom: 8 }}>
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
            formatter={(value: number | string, name: string, props: any) => {
              const numValue = typeof value === 'number' ? value : parseFloat(value);
              return [numValue ?? 0, name === 'count' ? 'Count' : name ?? ''];
            }}
            labelFormatter={(label) => `Range: ${label}`}
          />
          <Customized component={renderInlineLegend} />
          <Bar dataKey="count" name="count" fill={chartColor} radius={[4, 4, 0, 0]}>
            {data.bins.map((_, index) => (
              <Cell key={`cell-${index}`} fill={chartColor} fillOpacity={0.8} />
            ))}
          </Bar>

          {meanBinLabel && (
            <ReferenceLine
              x={meanBinLabel}
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
          )}

          {medianBinLabel && (
            <ReferenceLine
              x={medianBinLabel}
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
          )}
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

// Memoize the main component with custom comparison
const DistributionHistogram = memo(DistributionHistogramInner, (prevProps, nextProps) => {
  return (
    prevProps.data === nextProps.data &&
    prevProps.color === nextProps.color &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.error === nextProps.error
  );
});

DistributionHistogram.displayName = 'DistributionHistogram';

export default DistributionHistogram;
export { DistributionHistogram };
