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

interface MultiSeriesDataPoint {
  period: string;
  count: number;
  date?: Date;
  [key: string]: number | string | Date | undefined; // Dynamic series values
}

interface SeriesConfig {
  key: string;
  label: string;
  color: string;
}

interface TrendChartProps {
  data: MultiSeriesDataPoint[];
  series: SeriesConfig[];
  periodType: 'monthly' | 'quarterly' | 'yearly';
  type?: 'line' | 'area' | 'stacked';
}

// Color palette for multiple series
const CHART_COLORS = [
  '#1976d2', // Blue (primary)
  '#dc004e', // Red (secondary)
  '#00a152', // Green
  '#ff6f00', // Orange
  '#7b1fa2', // Purple
  '#00bcd4', // Cyan
  '#ff5722', // Deep Orange
  '#607d8b', // Blue Grey
  '#e91e63', // Pink
  '#8bc34a', // Light Green
];

const TrendChart: React.FC<TrendChartProps> = ({
  data,
  series,
  type = 'area',
}) => {
  const theme = useTheme();
  const gridColor = theme.palette.divider;
  const isStacked = type === 'stacked';
  const chartType = isStacked ? 'area' : type;

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
  const CustomTooltip = ({ active, payload, label }: any) => {
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
          {payload.map((entry: any, index: number) => (
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

  // Render lines/areas for each series
  const renderSeries = () => {
    return series.map((s, index) => {
      const color = s.color || CHART_COLORS[index % CHART_COLORS.length];

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

      // Area (normal or stacked)
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

  const chartData = data.map((point) => ({
    ...point,
  }));

  const ChartComponent = chartType === 'line' ? LineChart : AreaChart;

  // Inline SVG legend so exports include it
  const renderInlineLegend = ({ width, margin }: any) => {
    const itemHeight = 16;
    const padding = 6;
    const gap = 6;
    const approxChar = 7; // approximate px per character
    const maxLabelLen = Math.max(0, ...series.map(s => s.label.length));
    const legendWidth = Math.min(220, 16 + 8 + maxLabelLen * approxChar + padding * 2);
    const legendHeight = padding * 2 + series.length * itemHeight + (series.length - 1) * gap;
    const startX = Math.max(10, (width || 0) - (margin?.right || 0) - legendWidth - 10);
    const startY = (margin?.top || 0) + 5;

    return (
      <g>
        <rect x={startX} y={startY} width={legendWidth} height={legendHeight} rx={6} ry={6}
              fill="#fff" fillOpacity={0.85} stroke={theme.palette.divider} />
        {series.map((s, idx) => {
          const y = startY + padding + idx * (itemHeight + gap);
          const color = s.color || CHART_COLORS[idx % CHART_COLORS.length];
          return (
            <g key={s.key}>
              <rect x={startX + padding} y={y + 2} width={12} height={12} fill={color} stroke={color} />
              <text x={startX + padding + 12 + 6}
                    y={y + 12}
                    fill={theme.palette.text.primary}
                    fontSize={12}
                    alignmentBaseline="baseline">
                {s.label}
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  return (
    <ResponsiveContainer width="100%" height="100%" debounce={1}>
      <ChartComponent data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
          tickFormatter={(value) => formatTooltipValue(value)}
        />
        <Tooltip content={<CustomTooltip />} />
        <Customized component={renderInlineLegend} />
        {renderSeries()}
      </ChartComponent>
    </ResponsiveContainer>
  );
};

export default TrendChart;
export { CHART_COLORS };
