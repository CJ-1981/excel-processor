import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import type { CategoryDistribution } from '../../types';
import { getChartColors, formatCompactNumber } from '../../utils/chartDataTransformers';

interface TopDonorsChartProps {
  data: CategoryDistribution[];
  valueLabel: string;
  limit?: number;
}

const TopDonorsChart: React.FC<TopDonorsChartProps> = ({
  data,
  valueLabel,
  limit = 10,
}) => {
  const theme = useTheme();
  const COLORS = getChartColors();

  // Limit data and format for chart
  const chartData = data.slice(0, limit).map((item) => ({
    name: item.category,
    value: item.value,
    count: item.count,
    percentage: item.percentage,
  }));

  // Format tooltip values
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

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
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
            {data.name}
          </Typography>
          <Typography variant="body2" sx={{ color: payload[0].color }}>
            {valueLabel}: {formatTooltipValue(data.value)}
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

  if (data.length === 0) {
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
          No data available
        </Typography>
      </Box>
    );
  }

  const gridColor = theme.palette.divider;

  return (
    <Box sx={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="horizontal"
          margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="name"
            stroke={theme.palette.text.primary}
            tick={{ fill: theme.palette.text.primary, fontSize: '12px' }}
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis
            stroke={theme.palette.text.primary}
            tick={{ fill: theme.palette.text.primary }}
            tickFormatter={(value) => formatCompactNumber(value)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
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
