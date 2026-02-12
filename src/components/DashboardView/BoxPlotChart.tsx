import React from 'react';
import { Box, Typography, useTheme, Paper } from '@mui/material';
import type { Quartiles } from '../../types';
import { formatCurrencyGerman } from '../../utils/germanFormatter';

interface BoxPlotChartProps {
  data: Quartiles;
  title?: string;
  color?: string;
}

const BoxPlotChart: React.FC<BoxPlotChartProps> = ({
  data,
  title,
  color,
}) => {
  const theme = useTheme();
  const chartColor = color || theme.palette.primary.main;

  if (data.q1 === 0 && data.q3 === 0 && data.median === 0) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No data available for box plot
        </Typography>
      </Box>
    );
  }

  // Calculate Y-axis range
  const allValues = [data.min, data.max, ...data.outliers];
  const yMin = Math.min(...allValues);
  const yMax = Math.max(...allValues);
  const range = yMax - yMin;
  const padding = range * 0.1 || 10;

  // Calculate positions as percentages
  const chartMin = Math.max(0, yMin - padding);
  const chartMax = yMax + padding;
  const chartRange = chartMax - chartMin;

  const getPosition = (value: number) => {
    return ((value - chartMin) / chartRange) * 100;
  };

  const minPos = getPosition(data.min);
  const q1Pos = getPosition(data.q1);
  const medianPos = getPosition(data.median);
  const q3Pos = getPosition(data.q3);
  const maxPos = getPosition(data.max);

  return (
    <Box sx={{ width: '100%', height: 300 }} data-chart-id="box-plot">
      <Typography variant="subtitle2" gutterBottom align="center">
        {title || 'Value Distribution'}
      </Typography>

      {/* Visual Box Plot */}
      <Box
        sx={{
          position: 'relative',
          height: 200,
          mt: 3,
          mb: 2,
          px: 4,
        }}
      >
        {/* Y-axis labels on left */}
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 60,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            pr: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {formatCurrencyGerman(chartMax)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatCurrencyGerman((chartMax + chartMin) / 2)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatCurrencyGerman(chartMin)}
          </Typography>
        </Box>

        {/* Chart area */}
        <Box
          sx={{
            position: 'absolute',
            left: 70,
            right: 20,
            top: 0,
            bottom: 0,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            backgroundColor: 'action.hover',
          }}
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((pos) => (
            <Box
              key={pos}
              sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${100 - pos}%`,
                borderTop: 1,
                borderColor: 'divider',
                borderStyle: 'dashed',
              }}
            />
          ))}

          {/* Box plot elements container */}
          <Box
            sx={{
              position: 'absolute',
              left: '50%',
              top: 0,
              bottom: 0,
              width: 80,
              transform: 'translateX(-50%)',
            }}
          >
            {/* Lower whisker line */}
            <Box
              sx={{
                position: 'absolute',
                left: '50%',
                top: `${100 - minPos}%`,
                height: `${minPos - q1Pos}%`,
                width: 2,
                backgroundColor: chartColor,
                transform: 'translateX(-50%)',
              }}
            />

            {/* Upper whisker line */}
            <Box
              sx={{
                position: 'absolute',
                left: '50%',
                top: `${100 - q3Pos}%`,
                height: `${q3Pos - maxPos}%`,
                width: 2,
                backgroundColor: chartColor,
                transform: 'translateX(-50%)',
              }}
            />

            {/* Min cap */}
            <Box
              sx={{
                position: 'absolute',
                top: `${100 - minPos}%`,
                left: 10,
                right: 10,
                height: 2,
                backgroundColor: chartColor,
                transform: 'translateY(-50%)',
              }}
            />

            {/* Max cap */}
            <Box
              sx={{
                position: 'absolute',
                top: `${100 - maxPos}%`,
                left: 10,
                right: 10,
                height: 2,
                backgroundColor: chartColor,
                transform: 'translateY(-50%)',
              }}
            />

            {/* Box (IQR) */}
            <Paper
              elevation={0}
              sx={{
                position: 'absolute',
                top: `${100 - q3Pos}%`,
                height: `${q3Pos - q1Pos}%`,
                left: 5,
                right: 5,
                backgroundColor: chartColor,
                opacity: 0.3,
                border: 2,
                borderColor: chartColor,
                borderRadius: 1,
              }}
            />

            {/* Median line */}
            <Box
              sx={{
                position: 'absolute',
                top: `${100 - medianPos}%`,
                left: 0,
                right: 0,
                height: 3,
                backgroundColor: theme.palette.error.main,
                transform: 'translateY(-50%)',
              }}
            />

            {/* Outliers */}
            {data.outliers.map((outlier, index) => {
              const outlierPos = getPosition(outlier);
              return (
                <Box
                  key={index}
                  sx={{
                    position: 'absolute',
                    top: `${100 - outlierPos}%`,
                    left: '50%',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.error.main,
                    transform: 'translate(-50%, -50%)',
                  }}
                  title={formatCurrencyGerman(outlier)}
                />
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 1, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 16, height: 12, backgroundColor: chartColor, opacity: 0.3, border: 1, borderColor: chartColor }} />
          <Typography variant="caption" color="text.secondary">IQR (Q1-Q3)</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 16, height: 3, backgroundColor: theme.palette.error.main }} />
          <Typography variant="caption" color="text.secondary">Median</Typography>
        </Box>
        {data.outliers.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: theme.palette.error.main }} />
            <Typography variant="caption" color="error">Outliers ({data.outliers.length})</Typography>
          </Box>
        )}
      </Box>

      {/* Statistics Summary */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 1, flexWrap: 'wrap' }}>
        <Typography variant="caption" color="text.secondary">
          Min: {formatCurrencyGerman(data.min)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Q1: {formatCurrencyGerman(data.q1)}
        </Typography>
        <Typography variant="caption" color="error.main" fontWeight="bold">
          Median: {formatCurrencyGerman(data.median)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Q3: {formatCurrencyGerman(data.q3)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Max: {formatCurrencyGerman(data.max)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          IQR: {formatCurrencyGerman(data.iqr)}
        </Typography>
      </Box>
    </Box>
  );
};

export default BoxPlotChart;
