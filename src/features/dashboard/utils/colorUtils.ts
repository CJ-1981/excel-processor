/**
 * Color Utilities
 * Color management for charts and visualizations
 */

import { CHART_COLORS, type SeriesConfig } from '../types/chart';

export type { CHART_COLORS, ChartColor } from '../types/chart';

/**
 * Get chart color by index
 */
export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

/**
 * Get all chart colors
 */
export function getChartColors(): readonly string[] {
  return CHART_COLORS;
}

/**
 * Generate color overrides from selected columns
 */
export function generateColorOverrides(
  columns: string[],
  existingOverrides: Record<string, string> = {}
): Record<string, string> {
  const overrides: Record<string, string> = {};

  columns.forEach((column, index) => {
    // Preserve existing override if it exists
    if (existingOverrides[column]) {
      overrides[column] = existingOverrides[column];
    } else {
      overrides[column] = CHART_COLORS[index % CHART_COLORS.length];
    }
  });

  return overrides;
}

/**
 * Create series configuration from columns
 */
// SeriesConfig imported from chart.ts to avoid duplication

export function createSeriesConfig(
  columns: string[],
  columnMapping: Record<string, string>,
  colorOverrides: Record<string, string> = {}
): SeriesConfig[] {
  return columns.map((col, index) => ({
    key: col,
    label: columnMapping[col] || col,
    color: colorOverrides[col] || CHART_COLORS[index % CHART_COLORS.length],
  }));
}

/**
 * Generate chart colors dynamically based on count
 * Uses HSL color space for consistent distribution
 */
export function generateChartColors(count: number, baseHue: number = 210): string[] {
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    const hue = (baseHue + (i * 360) / count) % 360;
    const saturation = 70;
    const lightness = 50 + (i % 3) * 10;
    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }
  return colors;
}

/**
 * Format color with opacity
 */
export function formatColorWithOpacity(color: string, opacity: number): string {
  // Check if color is hex
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  // Check if color is rgb
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`);
  }

  return color;
}
