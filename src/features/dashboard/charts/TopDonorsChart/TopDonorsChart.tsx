/**
 * TopDonorsChart Component
 * Bar chart showing top N donors by contribution amount
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
  anonymize?: boolean;
}

// CustomTooltip factory function - creates tooltip with access to chartData for index lookup
const createCustomTooltip = (chartData: Array<{ name: string; value: number; count: number; percentage: number }>) => {
  const CustomTooltipComponent = memo(({ active, payload, label, anonymize = false }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      // Find the index for anonymized tooltip label
      let anonymizedLabel = '(Anonymized)';
      if (anonymize) {
        const index = chartData.findIndex(d => d.name === data.name);
        if (index !== -1) {
          anonymizedLabel = `(Anonymized #${index + 1})`;
        }
      }

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
            {anonymize ? anonymizedLabel : label}
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
  });
  CustomTooltipComponent.displayName = 'CustomTooltip';
  return CustomTooltipComponent;
};

const TopDonorsChartInner: React.FC<TopDonorsChartProps> = ({
  data,
  valueLabel,
  limit = 10,
  anonymize = false,
  isLoading = false,
  error,
}) => {
  const theme = useTheme();
  const COLORS = getChartColors();
  const gridColor = theme.palette.divider;

  // Memoize chart data transformation
  const chartData = useMemo(() => {
    return data.slice(0, limit).map((item) => ({
      name: item.category,
      value: item.value,
      count: item.count,
      percentage: item.percentage,
    }));
  }, [data, limit]);

  // Memoize should render check
  const shouldRender = useMemo(() => {
    return !isLoading && !error && data.length > 0;
  }, [isLoading, error, data.length]);

  // Create CustomTooltip component with access to chartData for index lookup
  const CustomTooltip = useMemo(() => createCustomTooltip(chartData), [chartData]);

  // Memoize inline legend rendering - position in right-top corner using SVG percentage
  const renderInlineLegend = useCallback(() => {
    const padding = 6;
    const boxSize = 12;
    const gap = 6;
    const label = valueLabel || 'Value';

    const legendXPercent = 85;
    const startY = 16;
    const color = COLORS[0];

    return (
      <g>
        <rect
          x={`${legendXPercent}%`}
          y={startY + padding}
          width={boxSize}
          height={boxSize}
          fill={color}
          stroke={color}
        />
        <text
          x={`${legendXPercent}%`}
          y={startY + padding + boxSize - 1}
          dx={boxSize + gap}
          fill={theme.palette.text.primary}
          fontSize={12}
          alignmentBaseline="baseline"
        >
          {label}
        </text>
      </g>
    );
  }, [valueLabel, COLORS, theme.palette.text.primary, gridColor]);

  // Memoize X-axis tick formatter for anonymization
  const formatXAxisTick = useCallback((value: unknown, index: number) => {
    const n = chartData.length;
    const step = n > 40 ? 10 : n > 20 ? 5 : n > 10 ? 2 : 1;
    return anonymize && index % step === 0 ? `#${index + 1}` : anonymize ? '' : String(value);
  }, [anonymize, chartData.length]);

  // Loading state
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

  // Error state
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

  // Empty state
  if (!shouldRender) {
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

  return (
    <Box
      sx={{ width: '100%', height: '100%', display: 'flex' }}
      data-chart-id="top-contributors"
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
        <BarChart
          data={chartData}
          layout="horizontal"
          margin={{ top: 16, right: 100, left: 40, bottom: 60 }}
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
            tickFormatter={formatXAxisTick}
          />
          <YAxis stroke={theme.palette.text.primary} tick={{ fill: theme.palette.text.primary }} tickFormatter={(value) => formatCompactNumber(value)} />
          <Tooltip content={(props: any) => <CustomTooltip {...props} anonymize={anonymize} />} />
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

// Memoize the main component with custom comparison
const TopDonorsChart = memo(TopDonorsChartInner, (prevProps, nextProps) => {
  return (
    prevProps.data === nextProps.data &&
    prevProps.valueLabel === nextProps.valueLabel &&
    prevProps.limit === nextProps.limit &&
    prevProps.anonymize === nextProps.anonymize &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.error === nextProps.error
  );
});

TopDonorsChart.displayName = 'TopDonorsChart';

export default TopDonorsChart;
export { TopDonorsChart };
