/**
 * Data Analysis Utilities
 * Wraps existing statisticsAnalyzer functions for dashboard use
 */

export {
  analyzeDataForDashboard,
  detectNumericColumns,
  detectDateColumns,
  calculateDistribution,
  getTopItems,
  extractNumericValues,
  calculateHistogram,
  calculatePareto,
  calculateRangeDistribution,
  calculateColumnStatistics,
  calculatePercentile,
  parseDate,
  aggregateByTime,
} from '../../../utils/statisticsAnalyzer';

export type {
  ColumnStatistics,
  TimeSeriesDataPoint,
  CategoryDistribution,
  DashboardAnalysis,
  HistogramData,
  HistogramBin,
  Quartiles,
  ParetoDataPoint,
  RangeDistributionData,
  ValueRange,
} from '../../../types';
