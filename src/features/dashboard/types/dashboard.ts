/**
 * Dashboard types module
 * Re-exports core dashboard types from the main types file
 */

export type {
  ColumnStatistics,
  DashboardAnalysis,
  CategoryDistribution,
  TimeSeriesDataPoint,
} from '../../../types';

export interface DashboardMetadata {
  totalRows: number;
  filteredRows: number;
  dateRange?: { start: Date; end: Date };
}

export interface DateColumnOption {
  key: string;
  label: string;
  isFromFilename?: boolean;
  isNotDateColumn?: boolean;
}
