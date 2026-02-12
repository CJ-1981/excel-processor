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
} from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import type { HistogramData } from '../../types';
import { calculateHistogram } from '../../utils/statisticsAnalyzer';
import { formatCurrencyGerman } from '../../utils/germanFormatter';

interface DistributionHistogramProps {
  data: HistogramData;
  valueLabel?: string;
  color?: string;
}

const DistributionHistogram: React.FC<DistributionHistogramProps> = ({
  data,
  // valueLabel is available for future use in tooltips
  color,
}) => {
  const theme = useTheme();
  const chartColor = color || theme.palette.primary.main;

  if (data.bins.length === 0) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No data available for histogram
        </Typography>
      </Box>
    );
  }

  // Calculate max count for Y-axis
  const maxCount = Math.max(...data.bins.map(b => b.count));
  const yAxisMax = Math.ceil(maxCount * 1.1); // Add 10% padding

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex' }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200} data-chart-id="histogram">
        <BarChart data={data.bins} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
            formatter={(value: number | undefined, name: string | undefined) => [
              value ?? 0,
              name === 'count' ? 'Count' : (name ?? ''),
            ]}
            labelFormatter={(label) => `Range: ${label}`}
          />
          <Bar dataKey="count" name="count" fill={chartColor} radius={[4, 4, 0, 0]}>
            {data.bins.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={chartColor}
                fillOpacity={0.8}
              />
            ))}
          </Bar>

          {/* Mean reference line */}
          <ReferenceLine
            x={data.bins.find(bin => data.mean >= bin.binStart && data.mean <= bin.binEnd)?.label}
            stroke={theme.palette.error.main}
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{
              value: `Mean: ${formatCurrencyGerman(data.mean)}`,
              position: 'top',
              fill: theme.palette.error.main,
              fontSize: 11,
            }}
          />

          {/* Median reference line */}
          <ReferenceLine
            x={data.bins.find(bin => data.median >= bin.binStart && data.median <= bin.binEnd)?.label}
            stroke={theme.palette.warning.main}
            strokeDasharray="3 3"
            strokeWidth={2}
            label={{
              value: `Median: ${formatCurrencyGerman(data.median)}`,
              position: 'top',
              fill: theme.palette.warning.main,
              fontSize: 11,
            }}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            sx={{
              width: 20,
              height: 3,
              backgroundColor: theme.palette.error.main,
              borderStyle: 'dashed',
            }}
          />
          <Typography variant="caption" color="text.secondary">
            Mean ({formatCurrencyGerman(data.mean)})
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            sx={{
              width: 20,
              height: 3,
              backgroundColor: theme.palette.warning.main,
              borderStyle: 'dashed',
            }}
          />
          <Typography variant="caption" color="text.secondary">
            Median ({formatCurrencyGerman(data.median)})
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default DistributionHistogram;
