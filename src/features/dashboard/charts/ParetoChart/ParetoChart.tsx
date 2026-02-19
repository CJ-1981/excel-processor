/**
 * ParetoChart Component
 * Pareto analysis chart showing cumulative contribution percentages
 * Optimized with React.memo to prevent unnecessary re-renders
 */

import React, { useMemo, memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
import type { ParetoDataPoint } from '../../types/chart';
import { formatCurrencyGerman, formatPercentGerman } from '../../../../utils/germanFormatter';

// Types for tooltip
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  anonymize?: boolean;
  valueLabel: string;
}

// CustomTooltip factory function - creates tooltip with access to displayData for index lookup
const createCustomTooltip = (displayData: ParetoDataPoint[], t: any) => {
  const CustomTooltipComponent = memo(({ active, payload, label, anonymize = false, valueLabel }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      // Find the index for anonymized tooltip label
      let anonymizedLabel = t('charts.anonymized');
      if (anonymize) {
        const index = displayData.findIndex(d => d.category === data.category);
        if (index !== -1) {
          anonymizedLabel = t('charts.anonymized', { index: index + 1 });
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
          {payload.map((entry: any, index: number) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color }}>
              {entry.name === 'cumulativePercentage'
                ? `${t('charts.cumulativePercent')}: ${formatPercentGerman(entry.value ?? 0)}`
                : entry.name === 'value'
                  ? `${valueLabel}: ${formatCurrencyGerman(entry.value ?? 0)}`
                  : `${entry.name}: ${entry.value}`
              }
            </Typography>
          ))}
          {data.cumulativePercentage !== undefined && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Cumulative %: {formatPercentGerman(data.cumulativePercentage)}
            </Typography>
          )}
        </Box>
      );
    }
    return null;
  });
  CustomTooltipComponent.displayName = 'CustomTooltip';
  return CustomTooltipComponent;
};

export interface ParetoChartProps {
  data: ParetoDataPoint[];
  valueLabel?: string;
  barColor?: string;
  lineColor?: string;
  showTop?: number;
  anonymize?: boolean;
  isLoading?: boolean;
  error?: Error;
  onExport?: (format: 'png' | 'jpg') => void;
  className?: string;
}

const ParetoChartInner: React.FC<ParetoChartProps> = ({
  data,
  valueLabel = 'Value',
  barColor,
  lineColor,
  showTop = 15,
  anonymize = false,
  isLoading = false,
  error,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const primaryBarColor = barColor || theme.palette.primary.main;
  const secondaryLineColor = lineColor || theme.palette.secondary.main;

  // Memoize display data slice
  const displayData = useMemo(() => data.slice(0, showTop), [data, showTop]);

  // Memoize computed values
  const { eightyPercentIndex, totalValue } = useMemo(() => {
    const idx = displayData.findIndex((d) => d.cumulativePercentage >= 80);
    const total = displayData.length > 0 ? displayData[displayData.length - 1].cumulativeValue : 0;
    return { eightyPercentIndex: idx, totalValue: total };
  }, [displayData]);

  // Memoize Y-axis tick formatter
  const formatYAxisLeft = useCallback((value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return String(value);
  }, []);

  // Memoize X-axis tick formatter for anonymization
  const formatXAxisTick = useCallback((value: unknown, index: number) => {
    const n = displayData.length;
    const step = n > 40 ? 10 : n > 20 ? 5 : n > 10 ? 2 : 1;
    return anonymize && index % step === 0 ? `#${index + 1}` : anonymize ? '' : String(value);
  }, [anonymize, displayData.length]);

  // Create CustomTooltip component with access to displayData for index lookup
  const CustomTooltip = useMemo(() => createCustomTooltip(displayData, t), [displayData, t]);

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
          {t('charts.noDataForPareto')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }} data-chart-id="pareto">
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
          <ComposedChart data={displayData} margin={{ top: 20, right: 60, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis
              dataKey="category"
              tick={{ fontSize: 10 }}
              stroke={theme.palette.text.secondary}
              angle={-45}
              textAnchor="end"
              interval={0}
              height={35}
              tickFormatter={formatXAxisTick}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11 }}
              stroke={theme.palette.text.secondary}
              domain={[0, totalValue]}
              tickFormatter={formatYAxisLeft}
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
                value: t('charts.cumulativePercent'),
                angle: 90,
                position: 'insideRight',
                style: { textAnchor: 'middle', fill: theme.palette.text.secondary },
              }}
            />
            <Tooltip content={(props: any) => <CustomTooltip {...props} anonymize={anonymize} valueLabel={valueLabel} />} />

            <Bar yAxisId="left" dataKey="value" name="value" radius={[4, 4, 0, 0]}>
              {displayData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index <= eightyPercentIndex ? primaryBarColor : theme.palette.grey[400]}
                  fillOpacity={index <= eightyPercentIndex ? 0.9 : 0.5}
                />
              ))}
            </Bar>

            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulativePercentage"
              stroke={secondaryLineColor}
              strokeWidth={2}
              dot={{ fill: secondaryLineColor, strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5 }}
            />

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

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: -1, gap: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.2, mb: -0.5 }}>
          {t('charts.contributors80', { count: eightyPercentIndex + 1 })}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, flexWrap: 'wrap' }}>
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
              {t('charts.cumulativePercent')}
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
              {t('charts.percent80Threshold')}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

// Memoize the main component with custom comparison
const ParetoChart = memo(ParetoChartInner, (prevProps, nextProps) => {
  return (
    prevProps.data === nextProps.data &&
    prevProps.valueLabel === nextProps.valueLabel &&
    prevProps.barColor === nextProps.barColor &&
    prevProps.lineColor === nextProps.lineColor &&
    prevProps.showTop === nextProps.showTop &&
    prevProps.anonymize === nextProps.anonymize &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.error === nextProps.error
  );
});

ParetoChart.displayName = 'ParetoChart';

export default ParetoChart;
export { ParetoChart };
