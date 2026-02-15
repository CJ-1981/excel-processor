/**
 * Chart-specific types module
 */

import type { CategoryDistribution, HistogramData, ParetoDataPoint, RangeDistributionData } from '../../../types';

// Chart type definitions
export type ChartType = 'line' | 'area' | 'stacked';
export type PeriodType = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type ExportFormat = 'png' | 'jpg';

// Multi-series time series data
export interface MultiSeriesDataPoint {
  period: string;
  count: number;
  date?: Date;
  [key: string]: number | string | Date | undefined;
}

// Series configuration for trend charts
export interface SeriesConfig {
  key: string;
  label: string;
  color: string;
}

// Trend chart data structure
export interface TrendChartData {
  period: PeriodType;
  series: SeriesConfig[];
  data: MultiSeriesDataPoint[];
}

// Top donors data structure
export interface TopDonorsData {
  donors: CategoryDistribution[];
  totalCount: number;
}

// Statistics data structure (reusing ColumnStatistics from main types)
export interface StatisticsData {
  columnName: string;
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  count: number;
}

// Histogram data structure (reusing HistogramData from main types)
export type { HistogramData, HistogramBin } from '../../../types';

// Pareto data structure (reusing ParetoDataPoint from main types)
export type { ParetoDataPoint } from '../../../types';

// Range distribution data structure (reusing RangeDistributionData from main types)
export type { RangeDistributionData, ValueRange } from '../../../types';

// Chart configuration interface
export interface ChartConfig {
  title?: string;
  colors?: Record<string, string>;
  anonymize?: boolean;
  [key: string]: unknown;
}

// Chart component props interface
export interface ChartComponentProps<T> {
  data: T;
  config: ChartConfig;
  isLoading?: boolean;
  error?: Error;
  onExport?: (format: ExportFormat) => void;
  className?: string;
}

// Color palette for charts
export const CHART_COLORS = [
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
] as const;

export type ChartColor = typeof CHART_COLORS[number];
