/**
 * Chart Calculation Utilities
 * Common calculations used across different chart types
 */

import type { MultiSeriesDataPoint } from '../types/chart';

// SeriesConfig is kept for compatibility but not currently used

/**
 * Format number for chart display
 */
export function formatChartValue(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

/**
 * Format number as compact (e.g., 1.2K, 1.5M)
 */
export function formatCompactNumber(value: number): string {
  if (value === 0) return '0';
  if (Math.abs(value) >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  }
  if (Math.abs(value) >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  return value.toString();
}

/**
 * Format tooltip value based on magnitude
 */
export function formatTooltipValue(value: number): string {
  if (value === 0) return '0.00';
  if (Math.abs(value) >= 1000000) {
    return (value / 1000000).toFixed(2) + 'M';
  }
  if (Math.abs(value) >= 1000) {
    return (value / 1000).toFixed(2) + 'K';
  }
  return value.toFixed(2);
}

/**
 * Calculate percentage of total
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Sort data by date
 */
export function sortByDate<T extends { date?: Date }>(data: T[]): T[] {
  return [...data].sort((a, b) => {
    const aTime = a.date?.getTime() ?? 0;
    const bTime = b.date?.getTime() ?? 0;
    return aTime - bTime;
  });
}

/**
 * Aggregate multiple value columns by time period
 * This is the core logic extracted from aggregateByTimeMultiple in DashboardView
 */
export interface TimeAggregationResult {
  weekly: MultiSeriesDataPoint[];
  monthly: MultiSeriesDataPoint[];
  quarterly: MultiSeriesDataPoint[];
  yearly: MultiSeriesDataPoint[];
}

interface AggregatedEntry {
  date: Date;
  values: Record<string, number>;
  count: number;
  latest?: Date; // For weekly - latest source date in the week
}

export function aggregateByTimeMultiple(
  data: Record<string, unknown>[],
  dateColumn: string,
  valueColumns: string[],
  parseDateFn: (value: unknown) => Date | null
): TimeAggregationResult {
  const weeklyAggregated = new Map<string, AggregatedEntry>();
  const monthlyAggregated = new Map<string, AggregatedEntry>();
  const quarterlyAggregated = new Map<string, AggregatedEntry>();
  const yearlyAggregated = new Map<string, AggregatedEntry>();

  data.forEach(row => {
    const date = parseDateFn(row[dateColumn]);
    if (!date) return;

    // Get all values for this row
    const rowValues: Record<string, number> = {};
    valueColumns.forEach(col => {
      rowValues[col] = parseFloat(row[col] as string) || 0;
    });

    // Weekly (ISO week)
    const weekInfo = getISOWeekInfo(date);
    const weeklyKey = `${weekInfo.weekYear}-W${String(weekInfo.weekNo).padStart(2, '0')}`;
    if (!weeklyAggregated.has(weeklyKey)) {
      weeklyAggregated.set(weeklyKey, {
        date: weekInfo.monday,
        values: Object.fromEntries(valueColumns.map(c => [c, 0])),
        count: 0,
        latest: date,
      });
    }
    const weeklyEntry = weeklyAggregated.get(weeklyKey)!;
    valueColumns.forEach(col => {
      weeklyEntry.values[col] += rowValues[col];
    });
    weeklyEntry.count += 1;
    if (!weeklyEntry.latest || date.getTime() > weeklyEntry.latest.getTime()) {
      weeklyEntry.latest = date;
    }

    // Monthly
    const monthlyKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthlyDate = new Date(date.getFullYear(), date.getMonth(), 1);
    if (!monthlyAggregated.has(monthlyKey)) {
      monthlyAggregated.set(monthlyKey, {
        date: monthlyDate,
        values: Object.fromEntries(valueColumns.map(c => [c, 0])),
        count: 0,
      });
    }
    const monthlyEntry = monthlyAggregated.get(monthlyKey)!;
    valueColumns.forEach(col => {
      monthlyEntry.values[col] += rowValues[col];
    });
    monthlyEntry.count += 1;

    // Quarterly
    const quarter = Math.floor(date.getMonth() / 3);
    const quarterlyKey = `${date.getFullYear()}-Q${quarter + 1}`;
    const quarterlyDate = new Date(date.getFullYear(), quarter * 3, 1);
    if (!quarterlyAggregated.has(quarterlyKey)) {
      quarterlyAggregated.set(quarterlyKey, {
        date: quarterlyDate,
        values: Object.fromEntries(valueColumns.map(c => [c, 0])),
        count: 0,
      });
    }
    const quarterlyEntry = quarterlyAggregated.get(quarterlyKey)!;
    valueColumns.forEach(col => {
      quarterlyEntry.values[col] += rowValues[col];
    });
    quarterlyEntry.count += 1;

    // Yearly
    const yearlyKey = `${date.getFullYear()}`;
    const yearlyDate = new Date(date.getFullYear(), 0, 1);
    if (!yearlyAggregated.has(yearlyKey)) {
      yearlyAggregated.set(yearlyKey, {
        date: yearlyDate,
        values: Object.fromEntries(valueColumns.map(c => [c, 0])),
        count: 0,
      });
    }
    const yearlyEntry = yearlyAggregated.get(yearlyKey)!;
    valueColumns.forEach(col => {
      yearlyEntry.values[col] += rowValues[col];
    });
    yearlyEntry.count += 1;
  });

  // Convert to arrays
  const convertToArray = (
    map: Map<string, AggregatedEntry>,
    labelFormatter?: (key: string, entry: AggregatedEntry) => string
  ): MultiSeriesDataPoint[] => {
    return Array.from(map.entries())
      .map(([key, entry]) => ({
        period: labelFormatter ? labelFormatter(key, entry) : key,
        count: entry.count,
        date: entry.date,
        ...entry.values,
      }))
      .sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0));
  };

  const fmtMonthDay = (dt: Date) => {
    try {
      const m = dt.toLocaleString('en-US', { month: 'short' });
      const day = String(dt.getDate()).padStart(2, '0');
      return `${m} ${day}`;
    } catch {
      return `${dt.getMonth() + 1}/${dt.getDate()}`;
    }
  };

  return {
    weekly: convertToArray(weeklyAggregated, (key, entry) =>
      `${key} (${fmtMonthDay((entry as AggregatedEntry & { latest: Date }).latest || entry.date)})`
    ),
    monthly: convertToArray(monthlyAggregated),
    quarterly: convertToArray(quarterlyAggregated),
    yearly: convertToArray(yearlyAggregated),
  };
}

/**
 * Get ISO week info for a date
 */
interface ISOWeekInfo {
  weekYear: number;
  weekNo: number;
  monday: Date;
}

function getISOWeekInfo(d: Date): ISOWeekInfo {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (date.getUTCDay() + 6) % 7; // Monday=0

  date.setUTCDate(date.getUTCDate() - day + 3);
  const weekYear = date.getUTCFullYear();

  const jan4 = new Date(Date.UTC(weekYear, 0, 4));
  const jan4Day = (jan4.getUTCDay() + 6) % 7;
  const week1Start = new Date(jan4);
  week1Start.setUTCDate(jan4.getUTCDate() - jan4Day);

  const weekNo = 1 + Math.round((date.getTime() - week1Start.getTime()) / 604800000);

  const monday = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const monOffset = (monday.getUTCDay() + 6) % 7;
  monday.setUTCDate(monday.getUTCDate() - monOffset);

  return { weekYear, weekNo, monday };
}
