/**
 * useDashboardData Hook
 * Manages data analysis and column detection for the dashboard
 */

import { useMemo } from 'react';
import {
  analyzeDataForDashboard,
  detectNumericColumns,
  detectDateColumns,
} from '../utils/dataAnalysis';
import type { DashboardAnalysis } from '../types';

export interface UseDashboardDataParams {
  data: Record<string, unknown>[];
  columnMapping: Record<string, string>;
  nameColumn: string | null;
}

export interface UseDashboardDataResult {
  analysis: DashboardAnalysis;
  numericColumns: string[];
  dateColumns: string[];
  isLoading: boolean;
}

/**
 * Hook to analyze data and detect columns for dashboard
 */
export function useDashboardData({
  data,
  columnMapping,
  nameColumn,
}: UseDashboardDataParams): UseDashboardDataResult {
  const analysis: DashboardAnalysis = useMemo(() => {
    if (data.length === 0) {
      return {
        numericColumns: [],
        timeSeries: {},
        distributions: {},
        topDonors: [],
        metadata: { totalRows: 0, filteredRows: 0 },
      };
    }

    try {
      return analyzeDataForDashboard(data, columnMapping, nameColumn ?? undefined);
    } catch (error) {
      console.error('Failed to analyze data for dashboard:', error);
      return {
        numericColumns: [],
        timeSeries: {},
        distributions: {},
        topDonors: [],
        metadata: { totalRows: data.length, filteredRows: data.length },
      };
    }
  }, [data, columnMapping, nameColumn]);

  const numericColumns = useMemo(() => {
    return detectNumericColumns(data);
  }, [data]);

  const dateColumns = useMemo(() => {
    return detectDateColumns(data);
  }, [data]);

  return {
    analysis,
    numericColumns,
    dateColumns,
    isLoading: false,
  };
}
