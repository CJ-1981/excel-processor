import type { ColumnStatistics, TimeSeriesDataPoint, CategoryDistribution } from '../types';

/**
 * Transform ColumnStatistics to format suitable for KPI cards
 */
export function transformToKPICardData(statistics: ColumnStatistics[]) {
  return statistics.map(stat => ({
    title: stat.columnLabel,
    sum: stat.sum,
    avg: stat.avg,
    min: stat.min,
    max: stat.max,
    count: stat.nonNullCount,
  }));
}

/**
 * Transform TimeSeriesDataPoint to Recharts format for line/area charts
 */
export function transformToLineChartData(data: TimeSeriesDataPoint[], dataKey: string = 'value') {
  return data.map(point => ({
    name: point.period,
    [dataKey]: point.value,
    count: point.count,
    date: point.date,
  }));
}

/**
 * Transform CategoryDistribution to Recharts format for pie/donut charts
 */
export function transformToPieChartData(
  data: CategoryDistribution[],
  labelKey: string = 'category',
  valueKey: string = 'value'
) {
  return data.map(item => ({
    name: item[labelKey as keyof CategoryDistribution] as string,
    value: item[valueKey as keyof CategoryDistribution] as number,
    count: item.count,
    percentage: item.percentage,
  }));
}

/**
 * Transform CategoryDistribution to Recharts format for bar charts
 */
export function transformToBarChartData(
  data: CategoryDistribution[],
  categoryKey: string = 'category',
  valueKey: string = 'value'
) {
  return data.map(item => ({
    [categoryKey]: item[categoryKey as keyof CategoryDistribution],
    [valueKey]: item[valueKey as keyof CategoryDistribution],
    count: item.count,
    percentage: item.percentage,
  }));
}

/**
 * Transform ColumnStatistics to table data format
 */
export function transformToStatisticsTableData(statistics: ColumnStatistics[]) {
  return statistics.map(stat => ({
    column: stat.columnLabel,
    sum: stat.sum.toFixed(2),
    avg: stat.avg.toFixed(2),
    min: stat.min.toFixed(2),
    max: stat.max.toFixed(2),
    median: stat.median.toFixed(2),
    stdDev: stat.stdDev.toFixed(2),
    count: stat.nonNullCount,
  }));
}

/**
 * Format number for display in charts
 */
export function formatChartValue(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

/**
 * Format number as compact (e.g., 1.2K, 1.5M)
 */
export function formatCompactNumber(value: number): string {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  return value.toString();
}

/**
 * Generate colors for charts
 */
export function generateChartColors(count: number, baseHue: number = 210): string[] {
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    const hue = (baseHue + (i * 360) / count) % 360;
    const saturation = 70;
    const lightness = 50 + (i % 3) * 10;
    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }
  return colors;
}

/**
 * Get Material-UI color palette for charts
 */
export function getChartColors() {
  return [
    '#1976d2', // Blue
    '#dc004e', // Pink
    '#388e3c', // Green
    '#f57c00', // Orange
    '#7b1fa2', // Purple
    '#0097a7', // Cyan
    '#c2185b', // Magenta
    '#fbc02d', // Yellow
    '#5d4037', // Brown
    '#455a64', // Blue Grey
  ];
}
