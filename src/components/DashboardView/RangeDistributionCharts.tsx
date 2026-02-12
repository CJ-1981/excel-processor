import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Box, Typography, useTheme, Paper } from '@mui/material';
import type { RangeDistributionData } from '../../types';
import { formatCurrencyGerman, formatPercentGerman } from '../../utils/germanFormatter';

interface RangeDistributionChartsProps {
  data: RangeDistributionData[];
  valueLabel?: string;
}

// Color palette for pie slices
const PIE_COLORS = [
  '#1976d2', // Blue
  '#388e3c', // Green
  '#f57c00', // Orange
  '#7b1fa2', // Purple
  '#c62828', // Red
  '#00838f', // Cyan
  '#5d4037', // Brown
  '#455a64', // Blue Grey
];

const RangeDistributionCharts: React.FC<RangeDistributionChartsProps> = ({
  data,
  valueLabel = 'Value',
}) => {
  const chartId = 'range-distribution';
  const theme = useTheme();

  if (data.length === 0) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No data available for range distribution
        </Typography>
      </Box>
    );
  }

  // Calculate total count for percentage
  const totalCount = data.reduce((sum, d) => sum + d.count, 0);

  // Prepare data for count pie
  const countData = data.map((d) => ({
    name: d.label,
    value: d.count,
    percentage: totalCount > 0 ? (d.count / totalCount) * 100 : 0,
    chartType: 'count' as const,
  }));

  // Prepare data for amount pie (already has amount and percentage)
  const amountData = data.map((d) => ({
    name: d.label,
    value: d.amount,
    percentage: d.percentage,
    chartType: 'amount' as const,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload;
    const isCountChart = data.chartType === 'count';

    return (
      <Box
        sx={{
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          p: 1.5,
          boxShadow: theme.shadows[2],
        }}
      >
        <Typography variant="subtitle2" gutterBottom>
          {data.name}
        </Typography>
        <Typography variant="body2">
          {isCountChart
            ? `Donors: ${data.value} (${formatPercentGerman(data.percentage)})`
            : `Amount: ${formatCurrencyGerman(data.value)} (${formatPercentGerman(data.percentage)})`}
        </Typography>
      </Box>
    );
  };

  // Custom label renderer
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show labels for small slices

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={11}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Box sx={{ width: '100%' }} data-chart-id={chartId}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {/* Donors by Count */}
        <Paper sx={{ flex: 1, minWidth: 280, p: 2 }}>
          <Typography variant="subtitle1" gutterBottom align="center">
            By Donor Count
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={150} minHeight={200}>
              <PieChart>
                <Pie
                  data={countData}
                  cx="50%"
                  cy="40%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={70}
                  dataKey="value"
                  nameKey="name"
                >
                  {countData.map((_, index) => (
                    <Cell
                      key={`cell-count-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  layout="horizontal"
                  align="center"
                  verticalAlign="bottom"
                  wrapperStyle={{ paddingTop: 10 }}
                  formatter={(value: string) => (
                    <span style={{ fontSize: 11 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </Box>
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            Total: {totalCount} donors
          </Typography>
        </Paper>

        {/* Donors by Amount */}
        <Paper sx={{ flex: 1, minWidth: 280, p: 2 }}>
          <Typography variant="subtitle1" gutterBottom align="center">
            By Total {valueLabel}
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={150} minHeight={200}>
              <PieChart>
                <Pie
                  data={amountData}
                  cx="50%"
                  cy="40%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={70}
                  dataKey="value"
                  nameKey="name"
                >
                  {amountData.map((_, index) => (
                    <Cell
                      key={`cell-amount-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  layout="horizontal"
                  align="center"
                  verticalAlign="bottom"
                  wrapperStyle={{ paddingTop: 10 }}
                  formatter={(value: string) => (
                    <span style={{ fontSize: 11 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </Box>
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            Total: {formatCurrencyGerman(data.reduce((sum, d) => sum + d.amount, 0))}
          </Typography>
        </Paper>
      </Box>

      {/* Summary Table */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Range Distribution Summary
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            p: 1,
          }}
        >
          {data.map((d, index) => (
            <Box
              key={d.label}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 0.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                    borderRadius: 0.5,
                  }}
                />
                <Typography variant="body2">{d.label}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {d.count} ({((d.count / totalCount) * 100).toFixed(1)}%)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatCurrencyGerman(d.amount)} ({formatPercentGerman(d.percentage)})
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default RangeDistributionCharts;
