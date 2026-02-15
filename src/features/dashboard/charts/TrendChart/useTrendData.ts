/**
 * useTrendData Hook
 * Manages trend chart data and configuration
 */

import { useMemo } from 'react';
import type { MultiSeriesDataPoint, SeriesConfig, ChartType, PeriodType } from '../../types/chart';
import { createSeriesConfig } from '../../utils/colorUtils';

export interface UseTrendDataParams {
  selectedValueColumns: string[];
  columnMapping: Record<string, string>;
  colorOverrides: Record<string, string>;
  timeSeriesData: {
    weekly: MultiSeriesDataPoint[];
    monthly: MultiSeriesDataPoint[];
    quarterly: MultiSeriesDataPoint[];
    yearly: MultiSeriesDataPoint[];
  };
  periodType: PeriodType;
  chartType: ChartType;
}

export interface UseTrendDataResult {
  data: MultiSeriesDataPoint[];
  series: SeriesConfig[];
  hasData: boolean;
}

/**
 * Hook to manage trend chart data and series configuration
 */
export function useTrendData({
  selectedValueColumns,
  columnMapping,
  colorOverrides,
  timeSeriesData,
  periodType,
}: UseTrendDataParams): UseTrendDataResult {
  const data = useMemo(() => {
    return timeSeriesData[periodType] || [];
  }, [timeSeriesData, periodType]);

  const series = useMemo(() => {
    return createSeriesConfig(selectedValueColumns, columnMapping, colorOverrides);
  }, [selectedValueColumns, columnMapping, colorOverrides]);

  const hasData = useMemo(() => {
    return data.length > 0 && selectedValueColumns.length > 0;
  }, [data.length, selectedValueColumns.length]);

  return {
    data,
    series,
    hasData,
  };
}
