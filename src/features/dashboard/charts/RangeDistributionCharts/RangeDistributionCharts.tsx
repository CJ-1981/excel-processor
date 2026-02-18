/**
 * RangeDistributionCharts Component
 * Pie charts showing distribution across value ranges
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
  Legend,
  LabelList,
} from 'recharts';
import { Box, Typography, useTheme, Paper } from '@mui/material';
import type { RangeDistributionData } from '../../types/chart';
import { formatCurrencyGerman, formatPercentGerman } from '../../../../utils/germanFormatter';

export interface RangeDistributionChartsProps {
  data: RangeDistributionData[];
  valueLabel?: string;
  isLoading?: boolean;
  error?: Error;
  onExport?: (format: 'png' | 'jpg') => void;
  className?: string;
}

// Move constants outside component
const PIE_COLORS = [
  '#1976d2',
  '#388e3c',
  '#f57c00',
  '#7b1fa2',
  '#c62828',
  '#00838f',
  '#5d4037',
  '#455a64',
] as const;

interface TooltipPayload {
  payload: {
    name: string;
    value: number;
    percentage: number;
    chartType: 'count' | 'amount';
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

// Memoized CustomTooltip component (outside main component)
const CustomTooltip = memo(({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  const isCount = d.chartType === 'count';
  return (
    <Box
      sx={{
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        p: 1.5,
        boxShadow: 3,
      }}
    >
      <Typography variant="subtitle2" gutterBottom>
        {d.name}
      </Typography>
      <Typography variant="body2">
        {isCount
          ? `Donors: ${d.value} (${formatPercentGerman(d.percentage)})`
          : `Amount: ${formatCurrencyGerman(d.value)} (${formatPercentGerman(d.percentage)})`}
      </Typography>
    </Box>
  );
});

CustomTooltip.displayName = 'CustomTooltip';

const RangeDistributionChartsInner: React.FC<RangeDistributionChartsProps> = ({
  data,
  valueLabel = 'Value',
  isLoading = false,
  error,
}) => {
  const theme = useTheme();

  // Memoize computed data transformations (descending order)
  const { totalCount, countData, amountData, totalAmount } = useMemo(() => {
    const total = data.reduce((sum, d) => sum + d.count, 0);
    const count = data.map((d) => ({
      name: d.label,
      value: d.count,
      percentage: total > 0 ? (d.count / total) * 100 : 0,
      chartType: ('count' as const),
    })).reverse(); // Descending order
    const amount = data.map((d) => ({
      name: d.label,
      value: d.amount,
      percentage: d.percentage,
      chartType: ('amount' as const),
    })).reverse(); // Descending order
    const totalAmt = data.reduce((sum, d) => sum + d.amount, 0);
    return { totalCount: total, countData: count, amountData: amount, totalAmount: totalAmt };
  }, [data]);

  // Memoize should render check
  const shouldRender = useMemo(() => {
    return !isLoading && !error && data.length > 0;
  }, [isLoading, error, data.length]);

  // Memoize tooltip formatter
  const formatTooltipValue = useCallback((value: number) => formatCurrencyGerman(value), []);

  // Memoize legend formatter
  const formatLegend = useCallback((v: string) => <span style={{ fontSize: 11 }}>{v}</span>, []);

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Loading range distribution...
        </Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="body2" color="error">
          Error loading chart: {error.message}
        </Typography>
      </Box>
    );
  }

  // Empty state
  if (!shouldRender) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No data available for range distribution
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }} data-chart-id="range-distribution">
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Paper sx={{ flex: 1, minWidth: 320, p: 2 }}>
          <Typography variant="subtitle1" gutterBottom align="center">
            By Donor Count
          </Typography>
          <Box sx={{ height: 360 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={220}>
              <BarChart data={countData} layout="vertical" margin={{ top: 10, right: 100, left: 24, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke={theme.palette.text.secondary} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} stroke={theme.palette.text.secondary} />
                <Tooltip content={(props: any) => <CustomTooltip {...props} />} />
                <Legend verticalAlign="bottom" height={24} wrapperStyle={{ paddingTop: 10 }} formatter={formatLegend} />
                <Bar dataKey="value" name="Count">
                  {countData.map((_, index) => (
                    <Cell key={`cell-count-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                  <LabelList dataKey="value" position="right" fontSize={11} fill={theme.palette.text.secondary} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            Total: {totalCount} donors
          </Typography>
        </Paper>

        <Paper sx={{ flex: 1, minWidth: 320, p: 2 }}>
          <Typography variant="subtitle1" gutterBottom align="center">
            By Total {valueLabel}
          </Typography>
          <Box sx={{ height: 360 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={220}>
              <BarChart data={amountData} layout="vertical" margin={{ top: 10, right: 120, left: 24, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke={theme.palette.text.secondary} tickFormatter={(v) => formatTooltipValue(v as number)} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} stroke={theme.palette.text.secondary} />
                <Tooltip content={(props: any) => <CustomTooltip {...props} />} />
                <Legend verticalAlign="bottom" height={24} wrapperStyle={{ paddingTop: 10 }} formatter={formatLegend} />
                <Bar dataKey="value" name={valueLabel}>
                  {amountData.map((_, index) => (
                    <Cell key={`cell-amount-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                  <LabelList dataKey="value" position="right" fontSize={11} fill={theme.palette.text.secondary} formatter={(v) => formatCurrencyGerman(Number(v || 0))} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            Total: {formatCurrencyGerman(totalAmount)}
          </Typography>
        </Paper>
      </Box>

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
          {[...data].reverse().map((d, index) => (
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
                    backgroundColor: PIE_COLORS[(data.length - 1 - index) % PIE_COLORS.length],
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

// Memoize the main component with custom comparison
const RangeDistributionCharts = memo(RangeDistributionChartsInner, (prevProps, nextProps) => {
  return (
    prevProps.data === nextProps.data &&
    prevProps.valueLabel === nextProps.valueLabel &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.error === nextProps.error
  );
});

RangeDistributionCharts.displayName = 'RangeDistributionCharts';

export default RangeDistributionCharts;
export { RangeDistributionCharts };
