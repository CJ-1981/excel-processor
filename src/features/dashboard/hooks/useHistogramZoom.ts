/**
 * useHistogramZoom Hook
 * Manages histogram zoom state
 */

import { useState, useCallback } from 'react';

export interface HistogramZoomState {
  zoomMin: number | null;
  zoomMax: number | null;
  isZoomed: boolean;
}

export interface UseHistogramZoomResult {
  zoomMin: number | null;
  zoomMax: number | null;
  isZoomed: boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  panLeft: () => void;
  panRight: () => void;
  resetZoom: () => void;
  setZoomRange: (min: number | null, max: number | null) => void;
}

export interface UseHistogramZoomParams {
  dataMin: number;
  dataMax: number;
  zoomFactor?: number; // Default: 0.75 (keep 75% of current range)
  panFactor?: number; // Default: 0.2 (pan by 20% of current range)
}

/**
 * Hook to manage histogram zoom state
 */
export function useHistogramZoom({
  dataMin,
  dataMax,
  zoomFactor = 0.75,
  panFactor = 0.2,
}: UseHistogramZoomParams): UseHistogramZoomResult {
  const [zoomMin, setZoomMin] = useState<number | null>(null);
  const [zoomMax, setZoomMax] = useState<number | null>(null);

  const isZoomed = zoomMin !== null || zoomMax !== null;

  const zoomIn = useCallback(() => {
    const currentMin = zoomMin ?? dataMin;
    const currentMax = zoomMax ?? dataMax;
    const range = currentMax - currentMin;
    const newRange = range * zoomFactor;
    const center = (currentMin + currentMax) / 2;

    setZoomMin(center - newRange / 2);
    setZoomMax(center + newRange / 2);
  }, [zoomMin, zoomMax, dataMin, dataMax, zoomFactor]);

  const zoomOut = useCallback(() => {
    const currentMin = zoomMin ?? dataMin;
    const currentMax = zoomMax ?? dataMax;
    const range = currentMax - currentMin;

    const expansion = range * (1 / zoomFactor - 1);
    const newMin = Math.max(dataMin, currentMin - expansion);
    const newMax = Math.min(dataMax, currentMax + expansion);

    if (newMin <= dataMin && newMax >= dataMax) {
      setZoomMin(null);
      setZoomMax(null);
    } else {
      setZoomMin(newMin);
      setZoomMax(newMax);
    }
  }, [zoomMin, zoomMax, dataMin, dataMax, zoomFactor]);

  const panLeft = useCallback(() => {
    if (zoomMin === null || zoomMax === null) return;

    const range = zoomMax - zoomMin;
    const shift = range * panFactor;
    const newMin = Math.max(dataMin, zoomMin - shift);
    const shiftDiff = zoomMin - newMin;

    setZoomMin(newMin);
    setZoomMax(zoomMax - shiftDiff);
  }, [zoomMin, zoomMax, dataMin, panFactor]);

  const panRight = useCallback(() => {
    if (zoomMin === null || zoomMax === null) return;

    const range = zoomMax - zoomMin;
    const shift = range * panFactor;
    const newMax = Math.min(dataMax, zoomMax + shift);
    const shiftDiff = newMax - zoomMax;

    setZoomMin(zoomMin + shiftDiff);
    setZoomMax(newMax);
  }, [zoomMin, zoomMax, dataMax, panFactor]);

  const resetZoom = useCallback(() => {
    setZoomMin(null);
    setZoomMax(null);
  }, []);

  const setZoomRange = useCallback((min: number | null, max: number | null) => {
    setZoomMin(min);
    setZoomMax(max);
  }, []);

  return {
    zoomMin,
    zoomMax,
    isZoomed,
    zoomIn,
    zoomOut,
    panLeft,
    panRight,
    resetZoom,
    setZoomRange,
  };
}
