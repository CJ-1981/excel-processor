/**
 * useRangeData Hook
 * Manages range distribution data
 */

import { useMemo } from 'react';
import { calculateRangeDistribution, extractNumericValues } from '../../utils/dataAnalysis';
import type { RangeDistributionData } from '../../types/chart';
import type { CategoryDistribution } from '../../types/chart';

export interface UseRangeDataParams {
  data: Record<string, unknown>[];
  selectedValueColumns: string[];
  nameColumn: string | null;
  allContributorsData: CategoryDistribution[];
}

export interface UseRangeDataResult {
  rangeDistributionData: RangeDistributionData[];
}

/**
 * Hook to calculate range distribution data
 */
export function useRangeData({
  data,
  selectedValueColumns,
  nameColumn,
  allContributorsData,
}: UseRangeDataParams): UseRangeDataResult {
  const rangeDistributionData = useMemo(() => {
    if (selectedValueColumns.length === 0) {
      return [];
    }

    let values: number[];

    if (nameColumn && allContributorsData.length > 0) {
      values = allContributorsData.map((d) => d.value);
    } else {
      values = extractNumericValues(data, selectedValueColumns[0]);
    }

    if (values.length === 0) {
      return [];
    }

    return calculateRangeDistribution(values);
  }, [data, selectedValueColumns, nameColumn, allContributorsData]);

  return {
    rangeDistributionData,
  };
}
