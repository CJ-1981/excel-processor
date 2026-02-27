/**
 * DonorCategoryBubbleChart Component
 * Bubble chart showing donor categories with average donation (Y) and total amount (bubble size)
 * Optimized with React.memo to prevent unnecessary re-renders
 */

import React, { useMemo, memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  ReferenceLine,
} from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import type { DonorCategoryDataPoint } from '../../types/chart';
import { formatCurrencyGerman } from '../../../../utils/germanFormatter';

export interface DonorCategoryBubbleChartProps {
  data: DonorCategoryDataPoint[];
  valueLabel?: string;
  anonymize?: boolean;
  isLoading?: boolean;
  error?: Error;
  onExport?: (format: 'png' | 'jpg') => void;
  className?: string;
  overallMean?: number;
  overallMedian?: number;
}

interface TooltipPayload {
  payload: {
    category: string;
    mean: number;
    total: number;
    count: number;
  };
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

const CustomTooltip: React.FC<CustomTooltipProps & { totalAmount: number; totalCount: number }> = ({
  active,
  payload,
  totalAmount,
  totalCount
}) => {
  const { t } = useTranslation();

  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const amountPercentage = totalAmount > 0 ? (data.total / totalAmount) * 100 : 0;
    const countPercentage = totalCount > 0 ? (data.count / totalCount) * 100 : 0;

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
          {data.category}
        </Typography>
        <Typography variant="body2" sx={{ color: payload[0].color }}>
          {t('charts.donorCount')}: {data.count} ({countPercentage.toFixed(1)}%)
        </Typography>
        <Typography variant="body2" sx={{ color: payload[0].color }}>
          {t('charts.totalAmount')}: {formatCurrencyGerman(data.total)} ({amountPercentage.toFixed(1)}%)
        </Typography>
        <Typography variant="body2" sx={{ color: payload[0].color }}>
          {t('charts.averageDonation')}: {formatCurrencyGerman(data.mean)}
        </Typography>
      </Box>
    );
  }
  return null;
};

const DonorCategoryBubbleChartInner: React.FC<DonorCategoryBubbleChartProps> = ({
  data,
  isLoading = false,
  error,
  overallMean,
  overallMedian,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  // Category colors in descending order
  const categoryColors: Record<string, string> = {
    '5K+ €': '#d32f2f', // Red
    '2K-5K €': '#f57c00', // Orange
    '1K-2K €': '#fbc02d', // Yellow/Gold
    '500-1K €': '#388e3c', // Green
    '100-500 €': '#1976d2', // Blue
    '<100 €': '#7b1fa2', // Purple
  };

  // Calculate totals for percentages
  const { totalAmount, totalCount } = useMemo(() => {
    return data.reduce(
      (acc, item) => ({
        totalAmount: acc.totalAmount + item.total,
        totalCount: acc.totalCount + item.count,
      }),
      { totalAmount: 0, totalCount: 0 }
    );
  }, [data]);

  // Custom shape function to render bubble with labels
  const renderBubble = useCallback((props: any) => {
    const { cx, cy, payload } = props;
    const { category, count, total } = payload;

    // Percentages relative to total
    const amountPercentage = totalAmount > 0 ? (total / totalAmount) * 100 : 0;
    const countPercentage = totalCount > 0 ? (count / totalCount) * 100 : 0;

    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={payload.z ? Math.sqrt(payload.z) / 2 : 50}
          fill={categoryColors[category] || theme.palette.primary.main}
          fillOpacity={0.7}
          stroke={categoryColors[category] || theme.palette.primary.main}
          strokeWidth={2}
        />
        {/* add donation range text label */}
        <text
          x={cx}
          y={cy - 70}
          textAnchor="middle"
          fontSize={15}
          fontWeight="bold"
          fill="#000"
        >
          {category}
        </text>
        <text
          x={cx}
          y={cy - 45}
          textAnchor="middle"
          fontSize={15}
          fill="#000"
        >
          {`${t('charts.donorCount')}: ${count} (${countPercentage.toFixed(1)}%)`}
        </text>
        <text
          x={cx}
          y={cy - 30}
          textAnchor="middle"
          fontSize={15}
          fill="#333"
        >
          {`${t('charts.totalAmount')}: ${formatCurrencyGerman(total)} (${amountPercentage.toFixed(1)}%)`}
        </text>
        <text
          x={cx}
          y={cy - 15}
          textAnchor="middle"
          fontSize={15}
          fill="#333"
        >
          {`${t('charts.averageDonation')}: ${formatCurrencyGerman(payload.mean)}`}
        </text>
      </g>
    );
  }, [categoryColors, theme.palette.primary.main, totalAmount, totalCount, t]);

  // Memoize display data - use numerical x positions for scatter plot
  const displayData = useMemo(() => {
    const result = data.map((item, index) => ({
      x: index, // Numerical position for X-axis
      y: item.mean,
      z: item.total,
      category: item.category,
      mean: item.mean,
      total: item.total,
      count: item.count,
    }));
    console.log('DonorCategoryBubbleChart displayData:', result);
    return result;
  }, [data]);

  // Calculate ZAxis range dynamically based on actual data
  const zRange = useMemo(() => {
    if (displayData.length === 0) return [100, 800];
    const minSize = 100;
    const maxSize = 800;
    return [minSize, maxSize];
  }, [displayData]);

  // X-axis tick formatter to show category names
  const formatXAxis = useCallback((value: number) => {
    const item = displayData.find(d => d.x === value);
    return item?.category || '';
  }, [displayData]);

  // Generate tick values for X-axis
  const xTicks = useMemo(() => {
    return displayData.map(d => d.x);
  }, [displayData]);

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ width: '100%', height: '100%', py: 8, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {t('charts.loadingData')}
        </Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ width: '100%', height: '100%', py: 8, textAlign: 'center' }}>
        <Typography variant="body2" color="error">
          {t('charts.errorLoading', { message: error.message })}
        </Typography>
      </Box>
    );
  }

  // Empty state
  if (displayData.length === 0) {
    return (
      <Box sx={{ width: '100%', height: '100%', py: 8, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {t('charts.noDataAvailable')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }} data-chart-id="donor-category-bubble">
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
          <ScatterChart margin={{ top: 20, right: 40, left: 60, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis
              type="number"
              dataKey="x"
              tick={{ fontSize: 10 }}
              stroke={theme.palette.text.secondary}
              angle={-45}
              textAnchor="end"
              interval={0}
              height={80}
              ticks={xTicks}
              tickFormatter={formatXAxis}
              domain={[-0.5, displayData.length - 0.5]}
            />
            <YAxis
              type="number"
              dataKey="y"
              tick={{ fontSize: 11 }}
              stroke={theme.palette.text.secondary}
              label={{
                value: t('charts.averageDonation'),
                angle: -90,
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: theme.palette.text.secondary },
              }}
              tickFormatter={(value) => formatCurrencyGerman(value)}
            />
            <ZAxis
              dataKey="z"
              range={zRange}
              name={t('charts.totalAmount')}
            />
            <Tooltip content={<CustomTooltip totalAmount={totalAmount} totalCount={totalCount} />} cursor={{ strokeDasharray: '3 3' }} />

            {overallMean !== undefined && (
              <ReferenceLine
                y={overallMean}
                stroke="#d32f2f"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: `${t('charts.average')}: ${formatCurrencyGerman(overallMean)}`,
                  position: 'insideTopRight',
                  fill: '#d32f2f',
                  fontSize: 12,
                  fontWeight: 'bold'
                }}
              />
            )}

            {overallMedian !== undefined && (
              <ReferenceLine
                y={overallMedian}
                stroke="#1976d2"
                strokeDasharray="3 3"
                strokeWidth={2}
                label={{
                  value: `${t('charts.median')}: ${formatCurrencyGerman(overallMedian)}`,
                  position: 'insideTopLeft',
                  fill: '#1976d2',
                  fontSize: 12,
                  fontWeight: 'bold'
                }}
              />
            )}

            {displayData.map((entry) => (
              <Scatter
                key={entry.category}
                data={[entry]}
                name={entry.category}
                shape={renderBubble}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap', mt: 1, alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          {t('charts.bubbleSize')} = {t('charts.totalAmount')}
        </Typography>
        <Typography variant="caption" color="text.primary" sx={{ fontWeight: 'bold' }}>
          {t('charts.donorCount')}: {totalCount}
        </Typography>
        <Typography variant="caption" color="text.primary" sx={{ fontWeight: 'bold' }}>
          {t('pdfExport.customFields.totalAmount')}: {formatCurrencyGerman(totalAmount)}
        </Typography>

        {/* Legends for reference lines */}
        {(overallMean !== undefined || overallMedian !== undefined) && (
          <Box sx={{ display: 'flex', gap: 2, ml: 2, borderLeft: '1px solid', borderColor: 'divider', pl: 2 }}>
            {overallMean !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 12, height: 2, bgcolor: '#d32f2f', borderStyle: 'dashed', borderTop: '2px dashed #d32f2f' }} />
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                  {t('charts.average')}: {formatCurrencyGerman(overallMean)}
                </Typography>
              </Box>
            )}
            {overallMedian !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 12, height: 2, bgcolor: '#1976d2', borderStyle: 'dashed', borderTop: '2px dashed #1976d2' }} />
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                  {t('charts.median')}: {formatCurrencyGerman(overallMedian)}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

// Memoize the main component with custom comparison
const DonorCategoryBubbleChart = memo(DonorCategoryBubbleChartInner, (prevProps, nextProps) => {
  return (
    prevProps.data === nextProps.data &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.error === nextProps.error &&
    prevProps.overallMean === nextProps.overallMean &&
    prevProps.overallMedian === nextProps.overallMedian
  );
});

DonorCategoryBubbleChart.displayName = 'DonorCategoryBubbleChart';

export default DonorCategoryBubbleChart;
export { DonorCategoryBubbleChart };
