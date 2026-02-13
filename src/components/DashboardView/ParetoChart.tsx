import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import type { ParetoDataPoint } from '../../types';
import { formatCurrencyGerman, formatPercentGerman } from '../../utils/germanFormatter';

interface ParetoChartProps {
  data: ParetoDataPoint[];
  valueLabel?: string;
  barColor?: string;
  lineColor?: string;
  showTop?: number;
  anonymize?: boolean; // hide names on X-axis
}

const ParetoChart: React.FC<ParetoChartProps> = ({
  data,
  valueLabel = 'Value',
  barColor,
  lineColor,
  showTop = 15,
  anonymize = false,
}) => {
  const theme = useTheme();
  const primaryBarColor = barColor || theme.palette.primary.main;
  const secondaryLineColor = lineColor || theme.palette.secondary.main;

  // Limit to top N items for readability
  const displayData = data.slice(0, showTop);

  if (displayData.length === 0) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No data available for Pareto analysis
        </Typography>
      </Box>
    );
  }

  // Find where 80% cumulative is reached
  const eightyPercentIndex = displayData.findIndex(
    (d) => d.cumulativePercentage >= 80
  );

  // Get total value for Y-axis domain (last item's cumulative value = total)
  const totalValue = displayData.length > 0 ? displayData[displayData.length - 1].cumulativeValue : 0;

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }} data-chart-id="pareto">
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
          <ComposedChart
            data={displayData}
            margin={{ top: 20, right: 60, left: 20, bottom: 70 }}
          >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis
            dataKey="category"
            tick={{ fontSize: 10 }}
            stroke={theme.palette.text.secondary}
            angle={-45}
            textAnchor="end"
            interval={0}
            height={60}
            tickFormatter={anonymize ? (() => '') as any : undefined}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11 }}
            stroke={theme.palette.text.secondary}
            domain={[0, totalValue]}
            tickFormatter={(value) => {
              if (value >= 1000) {
                return `${(value / 1000).toFixed(0)}k`;
              }
              return value;
            }}
            label={{
              value: valueLabel,
              angle: -90,
              position: 'insideLeft',
              style: { textAnchor: 'middle', fill: theme.palette.text.secondary },
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11 }}
            stroke={theme.palette.text.secondary}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            label={{
              value: 'Cumulative %',
              angle: 90,
              position: 'insideRight',
              style: { textAnchor: 'middle', fill: theme.palette.text.secondary },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: theme.shape.borderRadius,
            }}
            formatter={(value: number | undefined, name: string | undefined) => {
              if (name === 'cumulativePercentage') {
                return [formatPercentGerman(value ?? 0), 'Cumulative %'];
              }
              return [formatCurrencyGerman(value ?? 0), valueLabel];
            }}
          />

          {/* Bars with conditional coloring for 80% rule */}
          <Bar yAxisId="left" dataKey="value" name="value" radius={[4, 4, 0, 0]}>
            {displayData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={index <= eightyPercentIndex ? primaryBarColor : theme.palette.grey[400]}
                fillOpacity={index <= eightyPercentIndex ? 0.9 : 0.5}
              />
            ))}
          </Bar>

          {/* Cumulative percentage line */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cumulativePercentage"
            stroke={secondaryLineColor}
            strokeWidth={2}
            dot={{ fill: secondaryLineColor, strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5 }}
          />

          {/* 80% reference line */}
          <ReferenceLine
            yAxisId="right"
            y={80}
            stroke={theme.palette.error.main}
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{
              value: '80%',
              position: 'right',
              fill: theme.palette.error.main,
              fontSize: 12,
            }}
          />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>

      {/* 80/20 Analysis Summary */}
      <Box sx={{ mt: 1, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          {eightyPercentIndex + 1} contributor{eightyPercentIndex + 1 > 1 ? 's' : ''} account for ~80% of total value
        </Typography>
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            sx={{
              width: 16,
              height: 12,
              backgroundColor: primaryBarColor,
              borderRadius: 0.5,
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {valueLabel}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            sx={{
              width: 16,
              height: 3,
              backgroundColor: secondaryLineColor,
            }}
          />
          <Typography variant="caption" color="text.secondary">
            Cumulative %
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            sx={{
              width: 16,
              height: 3,
              backgroundColor: theme.palette.error.main,
              borderStyle: 'dashed',
            }}
          />
          <Typography variant="caption" color="text.secondary">
            80% threshold
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ParetoChart;
