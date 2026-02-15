/**
 * useStatistics Hook
 * Manages statistics table data
 */

import { useMemo } from 'react';
import { calculateColumnStatistics } from '../../utils/dataAnalysis';
import type { ColumnStatistics } from '../../types/chart';

export interface UseStatisticsParams {
  data: Record<string, unknown>[];
  numericColumns: string[];
  columnMapping: Record<string, string>;
}

export interface UseStatisticsResult {
  statistics: ColumnStatistics[];
  isLoading: boolean;
}

/**
 * Hook to calculate statistics for numeric columns
 */
export function useStatistics({
  data,
  numericColumns,
  columnMapping,
}: UseStatisticsParams): UseStatisticsResult {
  const statistics = useMemo(() => {
    if (data.length === 0 || numericColumns.length === 0) {
      return [];
    }

    return numericColumns.map((colKey) =>
      calculateColumnStatistics(data, colKey, columnMapping[colKey] || colKey)
    );
  }, [data, numericColumns, columnMapping]);

  return {
    statistics,
    isLoading: false,
  };
}
