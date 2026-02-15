/**
 * useHistogramData Hook
 * Manages histogram data with zoom support
 */

import { useMemo } from 'react';
import { calculateHistogram, extractNumericValues } from '../../utils/dataAnalysis';
import type { HistogramData } from '../../types/chart';

export interface UseHistogramDataParams {
  data: Record<string, unknown>[];
  selectedValueColumns: string[];
  nameColumn: string | null;
  allContributorsData: Array<{ category: string; value: number }>;
  histogramBins: number;
  zoomMin: number | null;
  zoomMax: number | null;
}

export interface UseHistogramDataResult {
  histogramData: HistogramData;
  distributionMinMax: { min: number; max: number };
}

/**
 * Hook to calculate histogram data with zoom support
 */
export function useHistogramData({
  data,
  selectedValueColumns,
  nameColumn,
  allContributorsData,
  histogramBins,
  zoomMin,
  zoomMax,
}: UseHistogramDataParams): UseHistogramDataResult {
  const histogramData = useMemo(() => {
    if (selectedValueColumns.length === 0) {
      return { bins: [], mean: 0, median: 0, min: 0, max: 0 };
    }

    let values: number[];

    if (nameColumn && allContributorsData.length > 0) {
      values = allContributorsData.map((d) => d.value);
    } else {
      values = extractNumericValues(data, selectedValueColumns[0]);
    }

    if (values.length === 0) {
      return { bins: [], mean: 0, median: 0, min: 0, max: 0 };
    }

    let filteredValues = values;
    if (zoomMin !== null || zoomMax !== null) {
      filteredValues = values.filter((v) => {
        if (zoomMin !== null && v < zoomMin) return false;
        if (zoomMax !== null && v > zoomMax) return false;
        return true;
      });
    }

    return calculateHistogram(filteredValues, histogramBins);
  }, [data, selectedValueColumns, nameColumn, allContributorsData, histogramBins, zoomMin, zoomMax]);

  const distributionMinMax = useMemo(() => {
    let values: number[];

    if (nameColumn && allContributorsData.length > 0) {
      values = allContributorsData.map((d) => d.value);
    } else if (selectedValueColumns.length > 0) {
      values = extractNumericValues(data, selectedValueColumns[0]);
    } else {
      return { min: 0, max: 0 };
    }

    if (values.length === 0) {
      return { min: 0, max: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    return { min: sorted[0], max: sorted[sorted.length - 1] };
  }, [data, selectedValueColumns, nameColumn, allContributorsData]);

  return {
    histogramData,
    distributionMinMax,
  };
}
