import React from 'react';
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
} from '@mui/material';
import type { ColumnStatistics } from '../../types';

interface StatisticsTableProps {
  statistics: ColumnStatistics[];
}

const StatisticsTable: React.FC<StatisticsTableProps> = ({ statistics }) => {
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
    if (value === 0) return '0.00';
    if (Math.abs(value) >= 1000000) {
      return (value / 1000000).toFixed(2) + 'M';
    }
    if (Math.abs(value) >= 1000) {
      return (value / 1000).toFixed(2) + 'K';
    }
    return value.toFixed(2);
  };

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>Column</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Sum</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Avg</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Min</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Max</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Median</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Std Dev</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Count</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {statistics.map((stat) => (
            <TableRow
              key={stat.columnName}
              hover
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
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
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default StatisticsTable;
