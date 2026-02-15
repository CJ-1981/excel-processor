/**
 * useParetoData Hook
 * Manages Pareto analysis data
 */

import { useMemo } from 'react';
import { calculatePareto } from '../../utils/dataAnalysis';
import type { ParetoDataPoint } from '../../types/chart';
import type { CategoryDistribution } from '../../types/chart';

export interface UseParetoDataParams {
  allContributorsData: CategoryDistribution[];
  paretoDonorsCount: number;
}

export interface UseParetoDataResult {
  paretoData: ParetoDataPoint[];
  totalCount: number;
}

/**
 * Hook to calculate Pareto analysis data
 */
export function useParetoData({
  allContributorsData,
  paretoDonorsCount,
}: UseParetoDataParams): UseParetoDataResult {
  const paretoData = useMemo(() => {
    if (!allContributorsData || allContributorsData.length === 0) {
      return [];
    }

    return calculatePareto(allContributorsData.slice(0, paretoDonorsCount));
  }, [allContributorsData, paretoDonorsCount]);

  const totalCount = useMemo(() => {
    return allContributorsData.length;
  }, [allContributorsData.length]);

  return {
    paretoData,
    totalCount,
  };
}
