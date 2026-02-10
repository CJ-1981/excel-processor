import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  FormControlLabel,
  Checkbox,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  BarChart,
  TableChart,
  ShowChart,
  AreaChart as AreaChartIcon,
  StackedLineChart,
  Close,
} from '@mui/icons-material';
import TrendChart, { CHART_COLORS } from './TrendChart';
import TopDonorsChart from './TopDonorsChart';
import StatisticsTable from './StatisticsTable';
import { analyzeDataForDashboard, detectNumericColumns, detectDateColumns, calculateDistribution, getTopItems } from '../../utils/statisticsAnalyzer';
import type { DashboardAnalysis } from '../../types';
import { formatDateGerman } from '../../utils/germanFormatter';

interface DashboardViewProps {
  data: any[];
  columnMapping: Record<string, string>;
  nameColumn: string | null;
}

type PeriodType = 'monthly' | 'quarterly' | 'yearly';
type ChartType = 'line' | 'area' | 'stacked';

// Date pattern for extracting dates from filenames (YYYYMMDD format)
const FILENAME_DATE_PATTERN = /(\d{8})/;

const DashboardView: React.FC<DashboardViewProps> = ({ data, columnMapping, nameColumn }) => {
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [chartType, setChartType] = useState<ChartType>('area');

  // Detect available columns
  const availableNumericColumns = useMemo(() => {
    return detectNumericColumns(data);
  }, [data]);

  const availableDateColumns = useMemo(() => {
    return detectDateColumns(data);
  }, [data]);

  // Check if dates can be extracted from filenames
  const hasFilenameDates = useMemo(() => {
    if (data.length === 0) return false;
    const sampleRow = data.find(row => row._sourceFileName);
    if (!sampleRow) return false;
    return !!sampleRow._sourceFileName.match(FILENAME_DATE_PATTERN);
  }, [data]);

  // Selected columns for charts (multiple selection)
  const [selectedValueColumns, setSelectedValueColumns] = useState<string[]>([]);
  const [selectedDateColumn, setSelectedDateColumn] = useState<string | null>(null);
  const [useFilenameDates, setUseFilenameDates] = useState<boolean>(false);

  // Set defaults when columns are detected
  React.useEffect(() => {
    // Auto-select only if there's exactly one numeric column
    if (availableNumericColumns.length === 1 && selectedValueColumns.length === 0) {
      setSelectedValueColumns([availableNumericColumns[0]]);
    }
  }, [availableNumericColumns, selectedValueColumns]);

  React.useEffect(() => {
    if (availableDateColumns.length > 0 && !selectedDateColumn) {
      setSelectedDateColumn(availableDateColumns[0]);
    }
    // Auto-enable filename dates if no date columns but filename dates available
    if (availableDateColumns.length === 0 && hasFilenameDates) {
      setUseFilenameDates(true);
    }
  }, [availableDateColumns, hasFilenameDates]);

  // Analyze data for dashboard
  const analysis: DashboardAnalysis = useMemo(() => {
    return analyzeDataForDashboard(data, columnMapping, nameColumn);
  }, [data, columnMapping, nameColumn]);

  // Get time series for selected columns (multi-series)
  const multiSeriesTimeData = useMemo(() => {
    if (selectedValueColumns.length === 0) {
      return { monthly: [], quarterly: [], yearly: [] };
    }

    // If using filename dates, extract from _sourceFileName
    if (useFilenameDates) {
      return aggregateByFilenameDateMultiple(data, selectedValueColumns);
    }

    // Otherwise use the selected date column
    if (!selectedDateColumn) {
      return { monthly: [], quarterly: [], yearly: [] };
    }

    return aggregateByTimeMultiple(data, selectedDateColumn, selectedValueColumns);
  }, [data, selectedDateColumn, selectedValueColumns, useFilenameDates]);

  // Get top contributors for first selected value column
  const topContributorsData = useMemo(() => {
    if (selectedValueColumns.length === 0 || !nameColumn) return [];

    const distribution = calculateDistribution(data, nameColumn, selectedValueColumns[0]);
    return getTopItems(distribution, 10);
  }, [data, selectedValueColumns, nameColumn]);

  // Build series configuration for TrendChart
  const seriesConfig = useMemo(() => {
    return selectedValueColumns.map((col, index) => ({
      key: col,
      label: columnMapping[col] || col,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [selectedValueColumns, columnMapping]);

  // Handle multi-select change
  const handleColumnChange = (event: any) => {
    const value = event.target.value;
    // On autofill we get a string when clicking the clear button
    if (typeof value === 'string') {
      setSelectedValueColumns(value === '' ? [] : [value]);
    } else {
      setSelectedValueColumns(value);
    }
  };

  // Handle removing a single column
  const handleRemoveColumn = (colToRemove: string) => {
    setSelectedValueColumns(prev => prev.filter(col => col !== colToRemove));
  };

  if (data.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No data available for dashboard
        </Typography>
      </Box>
    );
  }

  const hasTimeSeriesData = multiSeriesTimeData[periodType] && multiSeriesTimeData[periodType].length > 0;

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Data Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Showing {analysis.metadata.filteredRows} rows
          {analysis.metadata.dateRange && (
            <> from {formatDateGerman(analysis.metadata.dateRange.start)} to {formatDateGerman(analysis.metadata.dateRange.end)}</>
          )}
        </Typography>
      </Box>

      {/* Column Selectors */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
          Configure Dashboard Charts
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 250 }}>
            <InputLabel>Value Columns (multiple)</InputLabel>
            <Select
              multiple
              value={selectedValueColumns}
              label="Value Columns (multiple)"
              onChange={handleColumnChange}
              renderValue={() => (
                <Typography variant="body2" color="text.secondary">
                  {selectedValueColumns.length === 0
                    ? 'Select columns...'
                    : `${selectedValueColumns.length} column${selectedValueColumns.length > 1 ? 's' : ''} selected`}
                </Typography>
              )}
            >
              {availableNumericColumns.map((col) => (
                <MenuItem key={col} value={col}>
                  <Checkbox checked={selectedValueColumns.indexOf(col) > -1} size="small" />
                  {columnMapping[col] || col}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {hasFilenameDates && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={useFilenameDates}
                  onChange={(e) => setUseFilenameDates(e.target.checked)}
                  size="small"
                />
              }
              label="Use filename dates (YYYYMMDD)"
            />
          )}

          {!useFilenameDates && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Date Column (for trends)</InputLabel>
              <Select
                value={selectedDateColumn || ''}
                label="Date Column (for trends)"
                onChange={(e) => setSelectedDateColumn(e.target.value || null)}
                disabled={availableDateColumns.length === 0}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {availableDateColumns.map((col) => (
                  <MenuItem key={col} value={col}>
                    {columnMapping[col] || col}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>

        {/* Selected columns as chips */}
        {selectedValueColumns.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
            {selectedValueColumns.map((col, index) => (
              <Chip
                key={col}
                label={columnMapping[col] || col}
                onDelete={() => handleRemoveColumn(col)}
                size="small"
                sx={{
                  bgcolor: CHART_COLORS[index % CHART_COLORS.length] + '20',
                  border: `1px solid ${CHART_COLORS[index % CHART_COLORS.length]}`,
                  color: CHART_COLORS[index % CHART_COLORS.length],
                  '& .MuiChip-deleteIcon': {
                    color: CHART_COLORS[index % CHART_COLORS.length],
                    '&:hover': {
                      color: CHART_COLORS[index % CHART_COLORS.length],
                    },
                  },
                }}
                deleteIcon={<Close fontSize="small" />}
              />
            ))}
          </Box>
        )}

        {availableNumericColumns.length === 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            No numeric columns detected. Make sure your data contains numeric values.
          </Alert>
        )}
      </Paper>

      <Divider sx={{ my: 3 }} />

      {/* Charts Section */}
      <Grid container spacing={2}>
        {/* Trend Chart */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp color="primary" />
                <Typography variant="h6">
                  {hasTimeSeriesData ? 'Trend Over Time' : 'Trend Analysis'}
                </Typography>
              </Box>
              {hasTimeSeriesData && (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <InputLabel>Period</InputLabel>
                    <Select
                      value={periodType}
                      label="Period"
                      onChange={(e) => setPeriodType(e.target.value as PeriodType)}
                    >
                      <MenuItem value="monthly">Monthly</MenuItem>
                      <MenuItem value="quarterly">Quarterly</MenuItem>
                      <MenuItem value="yearly">Yearly</MenuItem>
                    </Select>
                  </FormControl>
                  <ToggleButtonGroup
                    value={chartType}
                    exclusive
                    onChange={(_, value) => value && setChartType(value)}
                    size="small"
                  >
                    <ToggleButton value="line" title="Line Chart">
                      <ShowChart fontSize="small" />
                    </ToggleButton>
                    <ToggleButton value="area" title="Area Chart">
                      <AreaChartIcon fontSize="small" />
                    </ToggleButton>
                    <ToggleButton value="stacked" title="Stacked Area">
                      <StackedLineChart fontSize="small" />
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              )}
            </Box>
            {hasTimeSeriesData && selectedValueColumns.length > 0 ? (
              <TrendChart
                data={multiSeriesTimeData[periodType]}
                series={seriesConfig}
                periodType={periodType}
                type={chartType}
              />
            ) : (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {selectedValueColumns.length === 0
                    ? 'Select value columns above to see trend analysis.'
                    : !useFilenameDates && !selectedDateColumn
                    ? 'Enable "Use filename dates" or select a date column above.'
                    : 'No trend data available for the selected columns.'}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Top Contributors Chart */}
        {topContributorsData.length > 0 && (
          <Grid size={{ xs: 12, lg: 6 }}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <BarChart color="primary" />
                <Typography variant="h6">Top Contributors</Typography>
              </Box>
              <TopDonorsChart
                data={topContributorsData}
                valueLabel={seriesConfig[0]?.label || 'Value'}
              />
            </Paper>
          </Grid>
        )}

        {/* Statistics Table */}
        <Grid size={{ xs: 12, lg: topContributorsData.length > 0 ? 6 : 12 }}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TableChart color="primary" />
              <Typography variant="h6">Descriptive Statistics</Typography>
            </Box>
            <StatisticsTable statistics={analysis.numericColumns} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

/**
 * Aggregate multiple value columns by time
 */
function aggregateByTimeMultiple(
  data: any[],
  dateColumn: string,
  valueColumns: string[]
): { monthly: any[]; quarterly: any[]; yearly: any[] } {
  const monthlyAggregated = new Map<string, { date: Date; values: Record<string, number>; count: number }>();
  const quarterlyAggregated = new Map<string, { date: Date; values: Record<string, number>; count: number }>();
  const yearlyAggregated = new Map<string, { date: Date; values: Record<string, number>; count: number }>();

  // Helper to parse date
  const parseDateValue = (value: any): Date | null => {
    if (value instanceof Date) return value;
    if (typeof value !== 'string') return null;
    const strValue = value.trim();

    if (/^\d{8}$/.test(strValue)) {
      const year = parseInt(strValue.substring(0, 4), 10);
      const month = parseInt(strValue.substring(4, 6), 10) - 1;
      const day = parseInt(strValue.substring(6, 8), 10);
      return new Date(year, month, day);
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(strValue)) {
      return new Date(strValue);
    }
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(strValue)) {
      const parts = strValue.split('.');
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(strValue)) {
      const parts = strValue.split('/');
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    return null;
  };

  data.forEach(row => {
    const date = parseDateValue(row[dateColumn]);
    if (!date) return;

    // Get all values for this row
    const rowValues: Record<string, number> = {};
    valueColumns.forEach(col => {
      rowValues[col] = parseFloat(row[col]) || 0;
    });

    // Monthly
    const monthlyKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthlyDate = new Date(date.getFullYear(), date.getMonth(), 1);
    if (!monthlyAggregated.has(monthlyKey)) {
      monthlyAggregated.set(monthlyKey, {
        date: monthlyDate,
        values: Object.fromEntries(valueColumns.map(c => [c, 0])),
        count: 0
      });
    }
    const monthlyEntry = monthlyAggregated.get(monthlyKey)!;
    valueColumns.forEach(col => { monthlyEntry.values[col] += rowValues[col]; });
    monthlyEntry.count += 1;

    // Quarterly
    const quarter = Math.floor(date.getMonth() / 3);
    const quarterlyKey = `${date.getFullYear()}-Q${quarter + 1}`;
    const quarterlyDate = new Date(date.getFullYear(), quarter * 3, 1);
    if (!quarterlyAggregated.has(quarterlyKey)) {
      quarterlyAggregated.set(quarterlyKey, {
        date: quarterlyDate,
        values: Object.fromEntries(valueColumns.map(c => [c, 0])),
        count: 0
      });
    }
    const quarterlyEntry = quarterlyAggregated.get(quarterlyKey)!;
    valueColumns.forEach(col => { quarterlyEntry.values[col] += rowValues[col]; });
    quarterlyEntry.count += 1;

    // Yearly
    const yearlyKey = `${date.getFullYear()}`;
    const yearlyDate = new Date(date.getFullYear(), 0, 1);
    if (!yearlyAggregated.has(yearlyKey)) {
      yearlyAggregated.set(yearlyKey, {
        date: yearlyDate,
        values: Object.fromEntries(valueColumns.map(c => [c, 0])),
        count: 0
      });
    }
    const yearlyEntry = yearlyAggregated.get(yearlyKey)!;
    valueColumns.forEach(col => { yearlyEntry.values[col] += rowValues[col]; });
    yearlyEntry.count += 1;
  });

  // Convert to arrays and sort by date
  const sortByDate = (map: Map<string, { date: Date; values: Record<string, number>; count: number }>) =>
    Array.from(map.entries())
      .map(([period, data]) => ({
        period,
        count: data.count,
        date: data.date,
        ...data.values,
      }))
      .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));

  return {
    monthly: sortByDate(monthlyAggregated),
    quarterly: sortByDate(quarterlyAggregated),
    yearly: sortByDate(yearlyAggregated),
  };
}

/**
 * Aggregate multiple value columns by extracting dates from filenames (YYYYMMDD format)
 */
function aggregateByFilenameDateMultiple(
  data: any[],
  valueColumns: string[]
): { monthly: any[]; quarterly: any[]; yearly: any[] } {
  const monthlyAggregated = new Map<string, { date: Date; values: Record<string, number>; count: number }>();
  const quarterlyAggregated = new Map<string, { date: Date; values: Record<string, number>; count: number }>();
  const yearlyAggregated = new Map<string, { date: Date; values: Record<string, number>; count: number }>();

  data.forEach(row => {
    const fileName = row._sourceFileName || '';
    const match = fileName.match(FILENAME_DATE_PATTERN);

    if (match) {
      const dateStr = match[1];
      const yearNum = parseInt(dateStr.substring(0, 4), 10);
      const monthNum = parseInt(dateStr.substring(4, 6), 10) - 1;

      // Get all values for this row
      const rowValues: Record<string, number> = {};
      valueColumns.forEach(col => {
        rowValues[col] = parseFloat(row[col]) || 0;
      });

      // Monthly
      const monthlyKey = `${yearNum}-${String(monthNum + 1).padStart(2, '0')}`;
      const monthlyDate = new Date(yearNum, monthNum, 1);
      if (!monthlyAggregated.has(monthlyKey)) {
        monthlyAggregated.set(monthlyKey, {
          date: monthlyDate,
          values: Object.fromEntries(valueColumns.map(c => [c, 0])),
          count: 0
        });
      }
      const monthlyEntry = monthlyAggregated.get(monthlyKey)!;
      valueColumns.forEach(col => { monthlyEntry.values[col] += rowValues[col]; });
      monthlyEntry.count += 1;

      // Quarterly
      const quarter = Math.floor(monthNum / 3);
      const quarterlyKey = `${yearNum}-Q${quarter + 1}`;
      const quarterlyDate = new Date(yearNum, quarter * 3, 1);
      if (!quarterlyAggregated.has(quarterlyKey)) {
        quarterlyAggregated.set(quarterlyKey, {
          date: quarterlyDate,
          values: Object.fromEntries(valueColumns.map(c => [c, 0])),
          count: 0
        });
      }
      const quarterlyEntry = quarterlyAggregated.get(quarterlyKey)!;
      valueColumns.forEach(col => { quarterlyEntry.values[col] += rowValues[col]; });
      quarterlyEntry.count += 1;

      // Yearly
      const yearlyKey = `${yearNum}`;
      const yearlyDate = new Date(yearNum, 0, 1);
      if (!yearlyAggregated.has(yearlyKey)) {
        yearlyAggregated.set(yearlyKey, {
          date: yearlyDate,
          values: Object.fromEntries(valueColumns.map(c => [c, 0])),
          count: 0
        });
      }
      const yearlyEntry = yearlyAggregated.get(yearlyKey)!;
      valueColumns.forEach(col => { yearlyEntry.values[col] += rowValues[col]; });
      yearlyEntry.count += 1;
    }
  });

  // Convert to arrays and sort by date
  const sortByDate = (map: Map<string, { date: Date; values: Record<string, number>; count: number }>) =>
    Array.from(map.entries())
      .map(([period, data]) => ({
        period,
        count: data.count,
        date: data.date,
        ...data.values,
      }))
      .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));

  return {
    monthly: sortByDate(monthlyAggregated),
    quarterly: sortByDate(quarterlyAggregated),
    yearly: sortByDate(yearlyAggregated),
  };
}

export default DashboardView;
