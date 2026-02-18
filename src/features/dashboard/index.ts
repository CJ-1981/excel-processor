/**
 * Dashboard feature barrel export
 */

export * from './utils';
export * from './hooks';
export * from './components';
// Re-export charts with explicit re-export to avoid duplicates
export { CHART_COLORS } from './types/chart';
export type { ChartType } from './types/chart';
export {
  TrendChart,
  TopDonorsChart,
  StatisticsTable,
  DistributionHistogram,
  ParetoChart,
  RangeDistributionCharts,
} from './charts';
export * from './charts/TrendChart';
export * from './charts/TopDonorsChart';
export * from './charts/StatisticsTable';
export * from './charts/DistributionHistogram';
export * from './charts/ParetoChart';
export * from './charts/RangeDistributionCharts';
