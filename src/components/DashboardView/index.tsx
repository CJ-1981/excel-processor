import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
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
  IconButton,
  Button,
} from '@mui/material';
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Wrap Responsive with WidthProvider for auto-width detection
const GridLayout = WidthProvider(Responsive);
import {
  TrendingUp,
  BarChart,
  TableChart,
  ShowChart,
  AreaChart as AreaChartIcon,
  StackedLineChart,
  Close,
  PieChart as PieChartIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Download,
} from '@mui/icons-material';
import TrendChart, { CHART_COLORS } from './TrendChart';
import TopDonorsChart from './TopDonorsChart';
import StatisticsTable from './StatisticsTable';
import DistributionHistogram from './DistributionHistogram';
import BoxPlotChart from './BoxPlotChart';
import ParetoChart from './ParetoChart';
import RangeDistributionCharts from './RangeDistributionCharts';
import {
  analyzeDataForDashboard,
  detectNumericColumns,
  detectDateColumns,
  calculateDistribution,
  getTopItems,
  extractNumericValues,
  calculateHistogram,
  calculateQuartiles,
  calculatePareto,
  calculateRangeDistribution,
} from '../../utils/statisticsAnalyzer';
import type { DashboardAnalysis } from '../../types';
import { formatDateGerman, formatCurrencyGerman } from '../../utils/germanFormatter';
import { debug, error, time, timeEnd } from '../../utils/logger';

interface DashboardViewProps {
  data: any[];
  columnMapping: Record<string, string>;
  nameColumn: string | null;
}

type PeriodType = 'monthly' | 'quarterly' | 'yearly';
type ChartType = 'line' | 'area' | 'stacked';

// Date pattern for extracting dates from filenames (YYYYMMDD format)
// Updated to be more specific - looks for 8 digits in a row
const FILENAME_DATE_PATTERN = /(\d{8})/;

const DashboardView: React.FC<DashboardViewProps> = ({ data, columnMapping, nameColumn }) => {
  useEffect(() => {
    debug('[Dashboard]', 'mount', {
      rows: data.length,
      cols: data.length > 0 ? Object.keys(data[0]).length : 0,
      nameColumn,
    });
  }, []);
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [chartType, setChartType] = useState<ChartType>('area');
  const [topDonorsCount, setTopDonorsCount] = useState<number>(10);
  const [paretoDonorsCount, setParetoDonorsCount] = useState<number>(15);
  const [histogramBins, setHistogramBins] = useState<number>(100);
  const [histogramZoomMin, setHistogramZoomMin] = useState<number | null>(null);
  const [histogramZoomMax, setHistogramZoomMax] = useState<number | null>(null);

  // Grid layout state for draggable/resizable charts
  const LAYOUT_STORAGE_KEY = 'excel-processor-dashboard-layout';
  const LAYOUT_VERSION = 7; // Increment to invalidate saved layouts
  const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
  const COLS_BREAKPOINTS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
  const ROW_HEIGHT_KEY = 'excel-processor-dashboard-rowheight';
  const [currentBreakpoint, setCurrentBreakpoint] = useState<keyof typeof BREAKPOINTS>('lg');

  // Helper function to download any chart as PNG/JPG
  const downloadChartAsImage = useCallback((chartId: string, format: 'png' | 'jpg' = 'png') => {
    const chartElement = document.querySelector(`[data-chart-id="${chartId}"] svg`);
    if (!chartElement) return;

    const svgData = new XMLSerializer().serializeToString(chartElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });

    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    img.onload = () => {
      canvas.width = chartElement.clientWidth || 800;
      canvas.height = chartElement.clientHeight || 400;
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `chart-${chartId}.${format}`;
          link.click();
          URL.revokeObjectURL(url);
        }
      }, `image/${format}`, 0.9);
    };

    img.src = URL.createObjectURL(svgBlob);
  }, []);

  // Default layout configuration for all breakpoints - full width, stacked vertically
  const defaultLayout = {
    lg: [
      { i: 'trend-chart', x: 0, y: 0, w: 12, h: 16, minW: 6, minH: 10 },
      { i: 'top-contributors', x: 0, y: 16, w: 12, h: 18, minW: 6, minH: 10 },
      { i: 'statistics-table', x: 0, y: 34, w: 12, h: 12, minW: 6, minH: 4 },
      { i: 'histogram', x: 0, y: 46, w: 12, h: 16, minW: 6, minH: 8 },
      { i: 'box-plot', x: 0, y: 62, w: 12, h: 16, minW: 6, minH: 8 },
      { i: 'pareto', x: 0, y: 78, w: 12, h: 14, minW: 6, minH: 8 },
      { i: 'range-distribution', x: 0, y: 92, w: 12, h: 18, minW: 6, minH: 10 },
    ],
    md: [
      { i: 'trend-chart', x: 0, y: 0, w: 10, h: 16, minW: 5, minH: 10 },
      { i: 'top-contributors', x: 0, y: 16, w: 10, h: 18, minW: 5, minH: 10 },
      { i: 'statistics-table', x: 0, y: 34, w: 10, h: 12, minW: 5, minH: 4 },
      { i: 'histogram', x: 0, y: 46, w: 10, h: 16, minW: 5, minH: 8 },
      { i: 'box-plot', x: 0, y: 62, w: 10, h: 16, minW: 5, minH: 8 },
      { i: 'pareto', x: 0, y: 78, w: 10, h: 14, minW: 5, minH: 8 },
      { i: 'range-distribution', x: 0, y: 92, w: 10, h: 18, minW: 5, minH: 10 },
    ],
    sm: [
      { i: 'trend-chart', x: 0, y: 0, w: 6, h: 16, minW: 3, minH: 10 },
      { i: 'top-contributors', x: 0, y: 16, w: 6, h: 18, minW: 3, minH: 10 },
      { i: 'statistics-table', x: 0, y: 34, w: 6, h: 12, minW: 3, minH: 4 },
      { i: 'histogram', x: 0, y: 46, w: 6, h: 16, minW: 3, minH: 8 },
      { i: 'box-plot', x: 0, y: 62, w: 6, h: 16, minW: 3, minH: 8 },
      { i: 'pareto', x: 0, y: 78, w: 6, h: 14, minW: 3, minH: 8 },
      { i: 'range-distribution', x: 0, y: 92, w: 6, h: 18, minW: 3, minH: 10 },
    ],
    xs: [
      { i: 'trend-chart', x: 0, y: 0, w: 4, h: 16, minW: 2, minH: 10 },
      { i: 'top-contributors', x: 0, y: 16, w: 4, h: 18, minW: 2, minH: 10 },
      { i: 'statistics-table', x: 0, y: 34, w: 4, h: 12, minW: 2, minH: 4 },
      { i: 'histogram', x: 0, y: 46, w: 4, h: 16, minW: 2, minH: 8 },
      { i: 'box-plot', x: 0, y: 62, w: 4, h: 16, minW: 2, minH: 8 },
      { i: 'pareto', x: 0, y: 78, w: 4, h: 14, minW: 2, minH: 8 },
      { i: 'range-distribution', x: 0, y: 92, w: 4, h: 18, minW: 2, minH: 10 },
    ],
    xxs: [
      { i: 'trend-chart', x: 0, y: 0, w: 2, h: 16, minW: 2, minH: 10 },
      { i: 'top-contributors', x: 0, y: 16, w: 2, h: 18, minW: 2, minH: 10 },
      { i: 'statistics-table', x: 0, y: 34, w: 2, h: 12, minW: 2, minH: 4 },
      { i: 'histogram', x: 0, y: 46, w: 2, h: 16, minW: 2, minH: 8 },
      { i: 'box-plot', x: 0, y: 62, w: 2, h: 16, minW: 2, minH: 8 },
      { i: 'pareto', x: 0, y: 78, w: 2, h: 14, minW: 2, minH: 8 },
      { i: 'range-distribution', x: 0, y: 92, w: 2, h: 18, minW: 2, minH: 10 },
    ],
  } as const;

  const ITEM_IDS = ['trend-chart', 'top-contributors', 'statistics-table', 'histogram', 'box-plot', 'pareto', 'range-distribution'];

  const sanitizeLayouts = (layoutsObj: any) => {
    const result: any = { ...layoutsObj };
    for (const bp of Object.keys(BREAKPOINTS)) {
      if (!result[bp]) {
        result[bp] = (defaultLayout as any)[bp];
        continue;
      }
      const idsInBp = new Set(result[bp].map((x: any) => x.i));
      const missing = ITEM_IDS.filter(id => !idsInBp.has(id));
      if (missing.length > 0) {
        const defaults = (defaultLayout as any)[bp].filter((x: any) => missing.includes(x.i));
        result[bp] = [...result[bp], ...defaults];
      }
    }
    return result;
  };

  const [layouts, setLayouts] = useState(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Check version and invalidate if old
        if (parsed._version !== LAYOUT_VERSION) {
          console.log('Layout version mismatch, using defaults');
          localStorage.removeItem(LAYOUT_STORAGE_KEY);
          return defaultLayout;
        }
        return sanitizeLayouts(parsed);
      }
    } catch (e) {
      console.warn('Could not load dashboard layout:', e);
    }
    return defaultLayout;
  });

  const handleLayoutChange = useCallback((_layout: any, newLayouts: any) => {
    setLayouts(newLayouts);
    try {
      const toSave = { ...newLayouts, _version: LAYOUT_VERSION };
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.warn('Could not save dashboard layout:', e);
    }
  }, []);

  const handleResetLayout = useCallback(() => {
    setLayouts(defaultLayout);
    localStorage.removeItem(LAYOUT_STORAGE_KEY);
  }, [defaultLayout]);

  // Row height for grid (user adjustable)
  const [rowHeight, setRowHeight] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(ROW_HEIGHT_KEY);
      return saved ? parseInt(saved, 10) || 50 : 50;
    } catch {
      return 50;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(ROW_HEIGHT_KEY, String(rowHeight)); } catch {}
  }, [rowHeight]);

  const handleAdjustWidgetHeight = useCallback((id: string, delta: number) => {
    setLayouts((prev: any) => {
      const newLayouts = { ...prev } as any;
      const arr = newLayouts[currentBreakpoint] || [];
      newLayouts[currentBreakpoint] = arr.map((item: any) =>
        item.i === id ? { ...item, h: Math.max(item.minH || 4, (item.h || 10) + delta) } : item
      );
      return newLayouts;
    });
  }, [currentBreakpoint]);

  // Detect available columns
  const availableNumericColumns = useMemo(() => {
    time('detectNumericColumns');
    let cols: string[] = [];
    try {
      cols = detectNumericColumns(data);
    } catch (e: any) {
      error('[Dashboard]', 'detectNumericColumns failed', e);
      cols = [];
    } finally {
      timeEnd('detectNumericColumns');
    }
    debug('[Dashboard]', 'numeric columns', cols);
    return cols;
  }, [data]);

  // Note: all column keys for selection are derived on-demand by each control

  const availableDateColumns = useMemo(() => {
    time('detectDateColumns');
    let cols: string[] = [];
    try {
      cols = detectDateColumns(data);
    } catch (e: any) {
      error('[Dashboard]', 'detectDateColumns failed', e);
      cols = [];
    } finally {
      timeEnd('detectDateColumns');
    }
    debug('[Dashboard]', 'date columns', cols);
    return cols;
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
  // Track if user explicitly toggled the filename-dates switch to avoid auto-re-enabling
  const [userToggledFilenameDates, setUserToggledFilenameDates] = useState<boolean>(false);

  // Set defaults when columns are detected
  React.useEffect(() => {
    // Auto-select only if there's exactly one numeric column
    if (availableNumericColumns.length === 1 && selectedValueColumns.length === 0) {
      setSelectedValueColumns([availableNumericColumns[0]]);
      debug('[Dashboard]', 'auto-select numeric column', availableNumericColumns[0]);
    }
  }, [availableNumericColumns, selectedValueColumns]);

  React.useEffect(() => {
    if (availableDateColumns.length > 0 && !selectedDateColumn) {
      setSelectedDateColumn(availableDateColumns[0]);
      debug('[Dashboard]', 'auto-select date column', availableDateColumns[0]);
    }
    // Auto-enable filename dates if no date columns but filename dates available
    if (availableDateColumns.length === 0 && hasFilenameDates && !useFilenameDates && !userToggledFilenameDates) {
      setUseFilenameDates(true);
      debug('[Dashboard]', 'auto-enable filename dates');
    }
  }, [availableDateColumns, hasFilenameDates, useFilenameDates, selectedDateColumn, userToggledFilenameDates]);

  // If the underlying dataset changes identity (e.g. new file), clear manual toggle so auto behavior can apply for new data
  React.useEffect(() => {
    setUserToggledFilenameDates(false);
  }, [data]);

  // Analyze data for dashboard
  const analysis: DashboardAnalysis = useMemo(() => {
    time('analyzeDataForDashboard');
    try {
      const result = analyzeDataForDashboard(data, columnMapping, nameColumn);
      debug('[Dashboard]', 'analysis complete', {
        numericStats: result.numericColumns?.length || 0,
        topDonors: result.topDonors?.length || 0,
        rows: result.metadata?.filteredRows,
      });
      return result;
    } catch (e: any) {
      error('[Dashboard]', 'analyzeDataForDashboard failed', e);
      return {
        numericColumns: [],
        timeSeries: {},
        distributions: {},
        topDonors: [],
        metadata: { totalRows: data.length, filteredRows: data.length },
      } as DashboardAnalysis;
    } finally {
      timeEnd('analyzeDataForDashboard');
    }
  }, [data, columnMapping, nameColumn]);

  // Get time series for selected columns (multi-series)
  const multiSeriesTimeData = useMemo(() => {
    if (selectedValueColumns.length === 0) {
      return { monthly: [], quarterly: [], yearly: [] };
    }

    // If using filename dates, extract from _sourceFileName
    if (useFilenameDates) {
      debug('[Dashboard]', 'aggregating by filename dates', { selectedValueColumns });
      return aggregateByFilenameDateMultiple(data, selectedValueColumns);
    }

    // Otherwise use the selected date column
    if (!selectedDateColumn) {
      return { monthly: [], quarterly: [], yearly: [] };
    }

    debug('[Dashboard]', 'aggregating by time', { selectedDateColumn, selectedValueColumns });
    return aggregateByTimeMultiple(data, selectedDateColumn, selectedValueColumns);
  }, [data, selectedDateColumn, selectedValueColumns, useFilenameDates]);

  // Get top contributors for first selected value column (aggregated by name)
  const topContributorsData = useMemo(() => {
    if (selectedValueColumns.length === 0 || !nameColumn) return [];

    const distribution = calculateDistribution(data, nameColumn, selectedValueColumns[0]);
    return getTopItems(distribution, topDonorsCount);
  }, [data, selectedValueColumns, nameColumn, topDonorsCount]);

  // Get ALL contributors aggregated by name (for donor-level statistics)
  const allContributorsData = useMemo(() => {
    if (selectedValueColumns.length === 0 || !nameColumn) return [];
    return calculateDistribution(data, nameColumn, selectedValueColumns[0]);
  }, [data, selectedValueColumns, nameColumn]);

  // Build series configuration for TrendChart
  const seriesConfig = useMemo(() => {
    return selectedValueColumns.map((col, index) => ({
      key: col,
      label: columnMapping[col] || col,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [selectedValueColumns, columnMapping]);

  // Get values for the first selected column for distribution charts
  // IMPORTANT: For donor analysis, we aggregate by unique name first
  // This means we analyze donor totals, not individual transactions
  const distributionValues = useMemo(() => {
    if (selectedValueColumns.length === 0) return [];

    if (nameColumn) {
      // Aggregate by unique name - each value represents one donor's total
      return allContributorsData.map(d => d.value);
    } else {
      // No name column - use individual transaction values
      return extractNumericValues(data, selectedValueColumns[0]);
    }
  }, [data, selectedValueColumns, nameColumn, allContributorsData]);

  // Calculate histogram data with zoom support
  const histogramData = useMemo(() => {
    if (distributionValues.length === 0) {
      return { bins: [], mean: 0, median: 0, min: 0, max: 0 };
    }

    // Apply zoom filter if set
    let filteredValues = distributionValues;
    if (histogramZoomMin !== null || histogramZoomMax !== null) {
      filteredValues = distributionValues.filter(v => {
        if (histogramZoomMin !== null && v < histogramZoomMin) return false;
        if (histogramZoomMax !== null && v > histogramZoomMax) return false;
        return true;
      });
    }

    return calculateHistogram(filteredValues, histogramBins);
  }, [distributionValues, histogramBins, histogramZoomMin, histogramZoomMax]);

  // Get overall min/max for zoom reset
  const distributionMinMax = useMemo(() => {
    if (distributionValues.length === 0) return { min: 0, max: 0 };
    const sorted = [...distributionValues].sort((a, b) => a - b);
    return { min: sorted[0], max: sorted[sorted.length - 1] };
  }, [distributionValues]);

  // Zoom in (reduce range by 25%)
  const handleHistogramZoomIn = () => {
    const currentMin = histogramZoomMin ?? distributionMinMax.min;
    const currentMax = histogramZoomMax ?? distributionMinMax.max;
    const range = currentMax - currentMin;
    const newRange = range * 0.75; // Keep 75% of current range
    const center = (currentMin + currentMax) / 2;

    setHistogramZoomMin(center - newRange / 2);
    setHistogramZoomMax(center + newRange / 2);
  };

  // Zoom out (increase range by ~33%)
  const handleHistogramZoomOut = () => {
    const currentMin = histogramZoomMin ?? distributionMinMax.min;
    const currentMax = histogramZoomMax ?? distributionMinMax.max;
    const range = currentMax - currentMin;

    // Expand by 33% on each side
    const expansion = range * 0.33;
    const newMin = Math.max(distributionMinMax.min, currentMin - expansion);
    const newMax = Math.min(distributionMinMax.max, currentMax + expansion);

    // If we're back to full range, reset zoom
    if (newMin <= distributionMinMax.min && newMax >= distributionMinMax.max) {
      setHistogramZoomMin(null);
      setHistogramZoomMax(null);
    } else {
      setHistogramZoomMin(newMin);
      setHistogramZoomMax(newMax);
    }
  };

  // Pan left (move view to the left by 20% of current range)
  const handleHistogramPanLeft = () => {
    if (histogramZoomMin === null || histogramZoomMax === null) return;

    const range = histogramZoomMax - histogramZoomMin;
    const shift = range * 0.2;
    const newMin = Math.max(distributionMinMax.min, histogramZoomMin - shift);
    const shiftDiff = histogramZoomMin - newMin;

    setHistogramZoomMin(newMin);
    setHistogramZoomMax(histogramZoomMax - shiftDiff);
  };

  // Pan right (move view to the right by 20% of current range)
  const handleHistogramPanRight = () => {
    if (histogramZoomMin === null || histogramZoomMax === null) return;

    const range = histogramZoomMax - histogramZoomMin;
    const shift = range * 0.2;
    const newMax = Math.min(distributionMinMax.max, histogramZoomMax + shift);
    const shiftDiff = newMax - histogramZoomMax;

    setHistogramZoomMin(histogramZoomMin + shiftDiff);
    setHistogramZoomMax(newMax);
  };

  // Reset zoom
  const handleHistogramZoomReset = () => {
    setHistogramZoomMin(null);
    setHistogramZoomMax(null);
  };

  // Calculate quartiles for box plot
  const quartilesData = useMemo(() => {
    if (distributionValues.length === 0) {
      return { min: 0, q1: 0, median: 0, q3: 0, max: 0, iqr: 0, outliers: [] };
    }
    return calculateQuartiles(distributionValues);
  }, [distributionValues]);

  // Calculate Pareto data (use configurable number of contributors)
  const paretoData = useMemo(() => {
    if (!allContributorsData || allContributorsData.length === 0) return [];
    return calculatePareto(allContributorsData.slice(0, paretoDonorsCount));
  }, [allContributorsData, paretoDonorsCount]);

  // Calculate range distribution
  const rangeDistributionData = useMemo(() => {
    if (distributionValues.length === 0) return [];
    return calculateRangeDistribution(distributionValues);
  }, [distributionValues]);

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
                  onChange={(e) => {
                    setUseFilenameDates(e.target.checked);
                    setUserToggledFilenameDates(true);
                  }}
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
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {(() => {
                  const options = availableDateColumns.length > 0
                    ? availableDateColumns
                    : (hasFilenameDates ? ['_sourceFileName'] : []);
                  return options;
                })().map((col) => (
                  <MenuItem key={col} value={col}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ flex: 1 }}>
                        {columnMapping[col] || col}
                      </Typography>
                      {col === '_sourceFileName' && (
                        <Chip
                          label="From filename"
                          size="small"
                          variant="outlined"
                          color="info"
                          sx={{ fontSize: '0.7rem', height: 20, '& .MuiChip-label': { fontSize: '0.65rem' } }}
                        />
                      )}
                      {col !== '_sourceFileName' && availableDateColumns.length > 0 && !availableDateColumns.includes(col) && (
                        <Chip
                          label="Not date"
                          size="small"
                          variant="outlined"
                          color="warning"
                          sx={{ fontSize: '0.7rem', height: 20, '& .MuiChip-label': { fontSize: '0.65rem' } }}
                        />
                      )}
                    </Box>
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

      {/* Layout controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">Row height</Typography>
          <FormControl size="small" sx={{ minWidth: 80 }}>
            <Select value={rowHeight} onChange={(e) => setRowHeight(Number(e.target.value))}>
              {[30, 40, 50, 60, 70, 80].map(v => (
                <MenuItem key={v} value={v}>{v}px</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Button
          variant="outlined"
          size="small"
          onClick={handleResetLayout}
        >
          Reset Layout
        </Button>
      </Box>

      {/* Charts Section with GridLayout */}
      <GridLayout
        className="layout"
        layouts={layouts}
        breakpoints={BREAKPOINTS}
        cols={COLS_BREAKPOINTS}
        rowHeight={rowHeight}
        onLayoutChange={handleLayoutChange}
        onBreakpointChange={(bp) => setCurrentBreakpoint(bp as any)}
        draggableHandle=".drag-handle"
        margin={[16, 16]}
        compactType="vertical"
        preventCollision={false}
        isDraggable={true}
        isResizable={true}
      >
        {/* Trend Chart */}
        <Paper key="trend-chart" sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box className="drag-handle" sx={{ cursor: 'move', display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp color="primary" />
              <Typography variant="h6">
                {hasTimeSeriesData ? 'Trend Over Time' : 'Trend Analysis'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton size="small" onClick={() => downloadChartAsImage('trend-chart', 'png')} title="Download as PNG">
                <Download fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => downloadChartAsImage('trend-chart', 'jpg')} title="Download as JPG">
                <Download fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => handleAdjustWidgetHeight('trend-chart', 2)} title="Taller">
                <AddIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => handleAdjustWidgetHeight('trend-chart', -2)} title="Shorter">
                <RemoveIcon fontSize="small" />
              </IconButton>
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
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }} data-chart-id="trend-chart">
            {hasTimeSeriesData && selectedValueColumns.length > 0 ? (
              <Box sx={{ height: '100%', width: '100%', display: 'flex' }}>
                <TrendChart
                  data={multiSeriesTimeData[periodType]}
                  series={seriesConfig}
                  periodType={periodType}
                  type={chartType}
                />
              </Box>
            ) : (
              <Box sx={{ py: 8, textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {selectedValueColumns.length === 0
                    ? 'Select value columns above to see trend analysis.'
                    : !useFilenameDates && !selectedDateColumn
                    ? 'Enable "Use filename dates" or select a date column above.'
                    : 'No trend data available for the selected columns.'}
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>

        {/* Top Contributors Chart */}
        {topContributorsData.length > 0 && (
          <Paper key="top-contributors" sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box className="drag-handle" sx={{ cursor: 'move', display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <BarChart color="primary" />
                <Typography variant="h6">Top Contributors</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton size="small" onClick={() => downloadChartAsImage('top-contributors', 'png')} title="Download as PNG">
                  <Download fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => downloadChartAsImage('top-contributors', 'jpg')} title="Download as JPG">
                  <Download fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => handleAdjustWidgetHeight('top-contributors', 2)} title="Taller">
                  <AddIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => handleAdjustWidgetHeight('top-contributors', -2)} title="Shorter">
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => setTopDonorsCount(prev => Math.max(5, prev - 5))}
                  disabled={topDonorsCount <= 5}
                  title="Show fewer"
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <Typography variant="body2" sx={{ minWidth: 60, textAlign: 'center' }}>
                  {topDonorsCount} donors
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setTopDonorsCount(prev => Math.min(allContributorsData.length, prev + 5))}
                  disabled={topDonorsCount >= allContributorsData.length}
                  title="Show more"
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <TopDonorsChart
                data={topContributorsData}
                valueLabel={seriesConfig[0]?.label || 'Value'}
                limit={topDonorsCount}
              />
            </Box>
          </Paper>
        )}

        {/* Statistics Table */}
        <Paper key="statistics-table" sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box className="drag-handle" sx={{ cursor: 'move', display: 'flex', alignItems: 'center', gap: 1, p: 2, mb: 2 }}>
            <TableChart color="primary" />
            <Typography variant="h6">Descriptive Statistics</Typography>
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
              <IconButton size="small" onClick={() => handleAdjustWidgetHeight('statistics-table', 2)} title="Taller">
                <AddIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => handleAdjustWidgetHeight('statistics-table', -2)} title="Shorter">
                <RemoveIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', width: '100%' }}>
            <StatisticsTable statistics={analysis.numericColumns} />
          </Box>
        </Paper>

        {/* Distribution Histogram */}
        {selectedValueColumns.length > 0 && (
          <Paper key="histogram" sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box className="drag-handle" sx={{ cursor: 'move', display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, pb: 1, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="subtitle1">
                Distribution Histogram
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton size="small" onClick={() => downloadChartAsImage('histogram', 'png')} title="Download as PNG">
                  <Download fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => setHistogramBins(prev => Math.max(10, prev - 10))} disabled={histogramBins <= 10} title="Fewer bins">
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <Typography variant="body2" sx={{ minWidth: 45, textAlign: 'center' }}>
                  {histogramBins} bins
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setHistogramBins(prev => Math.min(200, prev + 10))}
                  disabled={histogramBins >= 200}
                  title="More bins"
                >
                  <AddIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => handleAdjustWidgetHeight('histogram', 2)} title="Taller">
                  <AddIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => handleAdjustWidgetHeight('histogram', -2)} title="Shorter">
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                <IconButton
                  size="small"
                  onClick={handleHistogramZoomOut}
                  disabled={histogramZoomMin === null && histogramZoomMax === null}
                  title="Zoom out"
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={handleHistogramZoomIn}
                  disabled={distributionValues.length === 0}
                  title="Zoom in"
                >
                  <AddIcon fontSize="small" />
                </IconButton>
                {(histogramZoomMin !== null || histogramZoomMax !== null) && (
                  <>
                    <IconButton
                      size="small"
                      onClick={handleHistogramPanLeft}
                      disabled={histogramZoomMin !== null && histogramZoomMin <= distributionMinMax.min}
                      title="Pan left"
                    >
                      {'<'}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={handleHistogramPanRight}
                      disabled={histogramZoomMax !== null && histogramZoomMax >= distributionMinMax.max}
                      title="Pan right"
                    >
                      {'>'}
                    </IconButton>
                    <Button
                      size="small"
                      onClick={handleHistogramZoomReset}
                      sx={{ ml: 0.5 }}
                    >
                      Reset
                    </Button>
                  </>
                )}
              </Box>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', width: '100%' }}>
              <DistributionHistogram
                data={histogramData}
                valueLabel={seriesConfig[0]?.label || 'Value'}
              />
              {(histogramZoomMin !== null || histogramZoomMax !== null) && (
                <Typography variant="caption" color="text.secondary" align="center" display="block">
                  Zoomed: {formatCurrencyGerman(histogramZoomMin ?? distributionMinMax.min)} - {formatCurrencyGerman(histogramZoomMax ?? distributionMinMax.max)}
                </Typography>
              )}
            </Box>
          </Paper>
        )}

        {/* Box Plot */}
        {selectedValueColumns.length > 0 && (
          <Paper key="box-plot" sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box className="drag-handle" sx={{ cursor: 'move', display: 'flex', justifyContent: 'space-between', p: 2, pb: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                Box Plot Analysis
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton size="small" onClick={() => downloadChartAsImage('box-plot', 'png')} title="Download as PNG">
                  <Download fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => downloadChartAsImage('box-plot', 'jpg')} title="Download as JPG">
                  <Download fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => handleAdjustWidgetHeight('box-plot', 2)} title="Taller">
                  <AddIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => handleAdjustWidgetHeight('box-plot', -2)} title="Shorter">
                  <RemoveIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', width: '100%' }}>
              <BoxPlotChart
                data={quartilesData}
                title={seriesConfig[0]?.label || 'Value Distribution'}
              />
            </Box>
          </Paper>
        )}

        {/* Pareto Chart */}
        {selectedValueColumns.length > 0 && paretoData.length > 0 && (
          <Paper key="pareto" sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box className="drag-handle" sx={{ cursor: 'move', display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, pb: 1 }}>
              <Typography variant="subtitle1">
                Pareto Analysis (80/20 Rule)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton size="small" onClick={() => downloadChartAsImage('pareto', 'png')} title="Download as PNG">
                  <Download fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => handleAdjustWidgetHeight('pareto', 2)} title="Taller">
                  <AddIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => handleAdjustWidgetHeight('pareto', -2)} title="Shorter">
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => setParetoDonorsCount(prev => Math.max(5, prev - 5))} disabled={paretoDonorsCount <= 5} title="Show fewer">
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <Typography variant="body2" sx={{ minWidth: 60, textAlign: 'center' }}>
                  {paretoDonorsCount} donors
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setParetoDonorsCount(prev => Math.min(allContributorsData.length, prev + 5))}
                  disabled={paretoDonorsCount >= allContributorsData.length}
                  title="Show more"
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', width: '100%' }}>
              <ParetoChart
                data={paretoData}
                valueLabel={seriesConfig[0]?.label || 'Value'}
                showTop={paretoDonorsCount}
              />
            </Box>
          </Paper>
        )}

        {/* Range Distribution */}
        {selectedValueColumns.length > 0 && rangeDistributionData.length > 0 && (
          <Paper key="range-distribution" sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box className="drag-handle" sx={{ cursor: 'move', display: 'flex', alignItems: 'center', gap: 1, p: 2, pb: 1 }}>
              <PieChartIcon color="primary" />
              <Typography variant="h6">Range Distribution</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton size="small" onClick={() => downloadChartAsImage('range-distribution', 'png')} title="Download as PNG">
                <Download fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => downloadChartAsImage('range-distribution', 'jpg')} title="Download as JPG">
                <Download fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => handleAdjustWidgetHeight('range-distribution', 2)} title="Taller">
                <AddIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => handleAdjustWidgetHeight('range-distribution', -2)} title="Shorter">
                <RemoveIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', width: '100%' }}>
              <RangeDistributionCharts
                data={rangeDistributionData}
                valueLabel={seriesConfig[0]?.label || 'Value'}
              />
            </Box>
          </Paper>
        )}
      </GridLayout>
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

    // Try to find YYYYMMDD pattern (handles "20250105", "2025-01-05", "20250105_data.csv")
    const patternMatch = strValue.match(/(\d{4})(\d{2})(\d{2})/);
    if (patternMatch) {
      const year = parseInt(patternMatch[1], 10);
      const month = parseInt(patternMatch[2], 10) - 1;
      const day = parseInt(patternMatch[3], 10);
      return new Date(year, month, day);
    }

    // Check for YYYY-MM-DD pattern
    if (/^\d{4}-\d{2}-\d{2}$/.test(strValue)) {
      return new Date(strValue);
    }
    // Check for DD.MM.YYYY pattern (German format)
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(strValue)) {
      const parts = strValue.split('.');
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    // Check for MM/DD/YYYY pattern
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(strValue)) {
      const parts = strValue.split('/');
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    return null;
  };

  // Helper to extract date from filename (YYYYMMDD pattern)
  const extractDateFromFilename = (filename: string): Date | null => {
    if (!filename) return null;

    // Try to match exactly 8 digits (YYYYMMDD format)
    const exactMatch = filename.match(/\b\d{8}\b/);
    if (exactMatch) {
      const dateStr = exactMatch[0];
      const year = parseInt(dateStr.substring(0, 4), 10);
      const month = parseInt(dateStr.substring(4, 6), 10) - 1;
      const day = parseInt(dateStr.substring(6, 8), 10);
      return new Date(year, month, day);
    }

    // Try to find YYYYMMDD pattern anywhere in filename (e.g., "data-20250105.csv")
    const patternMatch = filename.match(/(\d{4})(\d{2})(\d{2})/);
    if (patternMatch) {
      const year = parseInt(patternMatch[1], 10);
      const month = parseInt(patternMatch[2], 10) - 1;
      const day = parseInt(patternMatch[3], 10);
      return new Date(year, month, day);
    }

    return null;
  };

  data.forEach(row => {
    // Handle _sourceFileName column specially - extract date from filename
    let date: Date | null = null;
    if (dateColumn === '_sourceFileName') {
      date = extractDateFromFilename(row._sourceFileName);
    } else {
      date = parseDateValue(row[dateColumn]);
    }

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
