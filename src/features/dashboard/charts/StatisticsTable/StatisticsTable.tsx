/**
 * StatisticsTable Component
 * Descriptive statistics table showing mean, median, min, max, and standard deviation
 * Optimized with React.memo to prevent unnecessary re-renders
 */

import React, { useState, useMemo, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Button,
  Collapse,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import type { ColumnStatistics } from '../../types/chart';
import { formatChartValue } from '../../utils/chartCalculations';

export interface StatisticsTableProps {
  statistics: ColumnStatistics[];
  isLoading?: boolean;
  error?: Error;
  className?: string;
}

// Memoized number formatter (outside component to avoid recreation)
const formatNumber = (value: number): string => {
  return formatChartValue(value);
};

const StatisticsTableInner: React.FC<StatisticsTableProps> = ({ statistics, isLoading = false, error }) => {
  const { t } = useTranslation();
  const [showPercentiles, setShowPercentiles] = useState(false);

  // Memoize toggle handler
  const togglePercentiles = useCallback(() => {
    setShowPercentiles(prev => !prev);
  }, []);

  // Memoize should render check
  const shouldRender = useMemo(() => {
    return !isLoading && !error && statistics.length > 0;
  }, [isLoading, error, statistics.length]);

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {t('charts.loadingData')}
        </Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="error">
          {t('charts.errorLoading', { message: error.message })}
        </Typography>
      </Box>
    );
  }

  // Empty state
  if (!shouldRender) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {t('dashboard.noNumericColumns')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <Button
          size="small"
          endIcon={showPercentiles ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          onClick={togglePercentiles}
        >
          {showPercentiles ? t('charts.hidePercentiles') : t('charts.showPercentiles')}
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('charts.column')}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                {t('charts.sum')}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                {t('charts.avg')}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                {t('charts.min')}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                {t('charts.max')}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                {t('charts.median')}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                {t('charts.stdDev')}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                {t('charts.nonNullCount')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {statistics.map((stat) => (
              <React.Fragment key={stat.columnName}>
                <TableRow hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                    {stat.columnLabel}
                  </TableCell>
                  <TableCell align="right">{formatNumber(stat.sum)}</TableCell>
                  <TableCell align="right">{formatNumber(stat.avg)}</TableCell>
                  <TableCell align="right">{formatNumber(stat.min)}</TableCell>
                  <TableCell align="right">{formatNumber(stat.max)}</TableCell>
                  <TableCell align="right">{formatNumber(stat.median)}</TableCell>
                  <TableCell align="right">{formatNumber(stat.stdDev)}</TableCell>
                  <TableCell align="right">{stat.nonNullCount}</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell colSpan={8} sx={{ py: 0, border: 0, backgroundColor: 'action.hover' }}>
                    <Collapse in={showPercentiles}>
                      <Box sx={{ py: 1, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <Typography variant="caption" color="text.secondary">
                          <strong>{t('charts.percentile25')}:</strong> {formatNumber(stat.percentile25)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          <strong>{t('charts.percentile75')}:</strong> {formatNumber(stat.percentile75)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          <strong>{t('charts.percentile90')}:</strong> {formatNumber(stat.percentile90)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          <strong>{t('charts.percentile95')}:</strong> {formatNumber(stat.percentile95)}
                        </Typography>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

// Memoize the main component with custom comparison
const StatisticsTable = memo(StatisticsTableInner, (prevProps, nextProps) => {
  return (
    prevProps.statistics === nextProps.statistics &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.error === nextProps.error
  );
});

StatisticsTable.displayName = 'StatisticsTable';

export default StatisticsTable;
export { StatisticsTable };
