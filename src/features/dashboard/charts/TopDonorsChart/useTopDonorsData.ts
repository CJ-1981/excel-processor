/**
 * useTopDonorsData Hook
 * Manages top donors chart data
 */

import { useMemo } from 'react';
import { calculateDistribution, getTopItems } from '../../utils/dataAnalysis';
import type { CategoryDistribution } from '../../types/chart';

export interface UseTopDonorsDataParams {
  data: Record<string, unknown>[];
  nameColumn: string | null;
  selectedValueColumns: string[];
  topDonorsCount: number;
}

export interface UseTopDonorsDataResult {
  topDonorsData: CategoryDistribution[];
  allContributorsData: CategoryDistribution[];
  totalCount: number;
}

/**
 * Hook to manage top donors chart data
 */
export function useTopDonorsData({
  data,
  nameColumn,
  selectedValueColumns,
  topDonorsCount,
}: UseTopDonorsDataParams): UseTopDonorsDataResult {
  const allContributorsData = useMemo(() => {
    if (selectedValueColumns.length === 0 || !nameColumn) {
      return [];
    }

    return calculateDistribution(data, nameColumn, selectedValueColumns[0]);
  }, [data, nameColumn, selectedValueColumns]);

  const topDonorsData = useMemo(() => {
    if (allContributorsData.length === 0) {
      return [];
    }

    return getTopItems(allContributorsData, topDonorsCount);
  }, [allContributorsData, topDonorsCount]);

  const totalCount = useMemo(() => {
    return allContributorsData.length;
  }, [allContributorsData.length]);

  return {
    topDonorsData,
    allContributorsData,
    totalCount,
  };
}
