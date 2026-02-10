import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Box, Typography } from '@mui/material';
import type { CategoryDistribution } from '../../types';
import { getChartColors } from '../../utils/chartDataTransformers';

interface DistributionChartProps {
  data: CategoryDistribution[];
}

const DistributionChart: React.FC<DistributionChartProps> = ({ data }) => {
  const COLORS = getChartColors();

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
          No distribution data available
        </Typography>
      </Box>
    );
  }

  // Format data for pie chart
  const pieData = data.map((item) => ({
    name: item.category,
    value: item.value,
    count: item.count,
    percentage: item.percentage,
  }));

  return (
    <Box sx={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            fill="#8884d8"
            paddingAngle={2}
            dataKey="value"
          >
            {pieData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value: string) => {
              // Truncate long names
              const maxLength = 15;
              const truncated =
                value.length > maxLength
                  ? value.substring(0, maxLength) + '...'
                  : value;
              return truncated;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default DistributionChart;
