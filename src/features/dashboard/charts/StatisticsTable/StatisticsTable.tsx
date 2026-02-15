/**
 * StatisticsTable Component
 * Descriptive statistics table showing mean, median, min, max, and standard deviation
 */

import React, { useState } from 'react';
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

const StatisticsTable: React.FC<StatisticsTableProps> = ({ statistics, isLoading = false, error }) => {
  const [showPercentiles, setShowPercentiles] = useState(false);

  if (isLoading) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Loading statistics...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="error">
          Error loading statistics: {error.message}
        </Typography>
      </Box>
    );
  }

  if (statistics.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No numeric columns found in the data
        </Typography>
      </Box>
    );
  }

  const formatNumber = (value: number): string => {
    return formatChartValue(value);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <Button
          size="small"
          endIcon={showPercentiles ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          onClick={() => setShowPercentiles(!showPercentiles)}
        >
          {showPercentiles ? 'Hide Percentiles' : 'Show Percentiles'}
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Column</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Sum
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Avg
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Min
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Max
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Median
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Std Dev
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Count
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
                          <strong>25th:</strong> {formatNumber(stat.percentile25)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          <strong>75th:</strong> {formatNumber(stat.percentile75)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          <strong>90th:</strong> {formatNumber(stat.percentile90)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          <strong>95th:</strong> {formatNumber(stat.percentile95)}
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

export default StatisticsTable;
