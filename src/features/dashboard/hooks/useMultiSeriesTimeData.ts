/**
 * useMultiSeriesTimeData Hook
 * Computes multi-series time data based on selected value columns
 */

import { useMemo } from 'react';
import { aggregateByTimeMultiple } from '../utils/chartCalculations';
import { parseDateValue, extractDateFromFilename } from '../utils/dateExtraction';
import type { MultiSeriesDataPoint } from '../types/chart';

export interface UseMultiSeriesTimeDataParams {
  data: Record<string, unknown>[];
  selectedDateColumn: string | null;
  selectedValueColumns: string[];
  useFilenameDates: boolean;
}

export interface TimeSeriesData {
  weekly: MultiSeriesDataPoint[];
  monthly: MultiSeriesDataPoint[];
  quarterly: MultiSeriesDataPoint[];
  yearly: MultiSeriesDataPoint[];
}

/**
 * Hook to compute multi-series time data for trend charts
 */
export function useMultiSeriesTimeData({
  data,
  selectedDateColumn,
  selectedValueColumns,
  useFilenameDates,
}: UseMultiSeriesTimeDataParams): TimeSeriesData {
  return useMemo(() => {
    if (selectedValueColumns.length === 0) {
      return { weekly: [], monthly: [], quarterly: [], yearly: [] };
    }

    // If using filename dates, extract from _sourceFileName
    if (useFilenameDates) {
      return aggregateByFilenameDate(data, selectedValueColumns);
    }

    // Otherwise use the selected date column
    if (!selectedDateColumn) {
      return { weekly: [], monthly: [], quarterly: [], yearly: [] };
    }

    return aggregateByTimeMultiple(data, selectedDateColumn, selectedValueColumns, parseDateValue);
  }, [data, selectedDateColumn, selectedValueColumns, useFilenameDates]);
}

/**
 * Aggregate data by extracting dates from filenames (YYYYMMDD format)
 */
function aggregateByFilenameDate(
  data: Record<string, unknown>[],
  valueColumns: string[]
): TimeSeriesData {
  const weeklyAggregated = new Map<
    string,
    { date: Date; values: Record<string, number>; count: number; latest: Date }
  >();
  const monthlyAggregated = new Map<
    string,
    { date: Date; values: Record<string, number>; count: number }
  >();
  const quarterlyAggregated = new Map<
    string,
    { date: Date; values: Record<string, number>; count: number }
  >();
  const yearlyAggregated = new Map<
    string,
    { date: Date; values: Record<string, number>; count: number }
  >();

  data.forEach(row => {
    const fileName = row._sourceFileName as string | undefined;
    if (!fileName) return;

    const date = extractDateFromFilename(fileName);
    if (!date) return;

    const yearNum = date.getFullYear();
    const monthNum = date.getMonth();

    // Get all values for this row
    const rowValues: Record<string, number> = {};
    valueColumns.forEach(col => {
      rowValues[col] = parseFloat((row[col] as string) ?? '0') || 0;
    });

    // Weekly aggregation
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
    const wEntry = weeklyAggregated.get(weeklyKey)!;
    valueColumns.forEach(col => {
      wEntry.values[col] += rowValues[col];
    });
    wEntry.count += 1;
    if (date.getTime() > wEntry.latest.getTime()) {
      wEntry.latest = date;
    }

    // Monthly aggregation
    const monthlyKey = `${yearNum}-${String(monthNum + 1).padStart(2, '0')}`;
    const monthlyDate = new Date(yearNum, monthNum, 1);
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

    // Quarterly aggregation
    const quarter = Math.floor(monthNum / 3);
    const quarterlyKey = `${yearNum}-Q${quarter + 1}`;
    const quarterlyDate = new Date(yearNum, quarter * 3, 1);
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

    // Yearly aggregation
    const yearlyKey = `${yearNum}`;
    const yearlyDate = new Date(yearNum, 0, 1);
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
    map: Map<string, { date: Date; values: Record<string, number>; count: number; latest?: Date }>,
    labelFormatter?: (key: string, entry: { date: Date; latest?: Date }) => string
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
      `${key}\n(${fmtMonthDay(entry.latest || entry.date)})`
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
  const day = (date.getUTCDay() + 6) % 7;

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
