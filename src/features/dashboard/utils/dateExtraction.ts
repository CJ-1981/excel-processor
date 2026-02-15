/**
 * Date Extraction Utilities
 * Extracted from DashboardView monolith for reusability
 */

export interface DateParseResult {
  date: Date | null;
  format?: string;
}

/**
 * Parse a date value from various formats
 * Extracted from aggregateByTimeMultiple in DashboardView
 */
export function parseDateValue(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value !== 'string') return null;
  const strValue = value.trim();

  // Try to find YYYYMMDD pattern (handles "20250105", "2025-01-05", "20250105_data.csv")
  const patternMatch = strValue.match(/(\d{4})(\d{2})(\d{2})/);
  if (patternMatch) {
    const year = parseInt(patternMatch[1], 10);
    const month = parseInt(patternMatch[2], 10) - 1;
    const day = parseInt(patternMatch[3], 10);
    return new Date(year, month, day);
  }

  // Check for YYYY-MM-DD pattern
  if (/^\d{4}-\d{2}-\d{2}$/.test(strValue)) {
    return new Date(strValue);
  }

  // Check for DD.MM.YYYY pattern (German format)
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(strValue)) {
    const parts = strValue.split('.');
    return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
  }

  // Check for MM/DD/YYYY pattern
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(strValue)) {
    const parts = strValue.split('/');
    return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
  }

  return null;
}

/**
 * Extract date from filename (YYYYMMDD pattern)
 * Extracted from DashboardView monolith
 */
export function extractDateFromFilename(filename: string): Date | null {
  if (!filename) return null;

  // Try to match exactly 8 digits (YYYYMMDD format)
  const exactMatch = filename.match(/\b\d{8}\b/);
  if (exactMatch) {
    const dateStr = exactMatch[0];
    const year = parseInt(dateStr.substring(0, 4), 10);
    const month = parseInt(dateStr.substring(4, 6), 10) - 1;
    const day = parseInt(dateStr.substring(6, 8), 10);
    return new Date(year, month, day);
  }

  // Try to find YYYYMMDD pattern anywhere in filename (e.g., "data-20250105.csv")
  const patternMatch = filename.match(/(\d{4})(\d{2})(\d{2})/);
  if (patternMatch) {
    const year = parseInt(patternMatch[1], 10);
    const month = parseInt(patternMatch[2], 10) - 1;
    const day = parseInt(patternMatch[3], 10);
    return new Date(year, month, day);
  }

  return null;
}

/**
 * Check if filename contains a date pattern
 */
export function hasFilenameDate(filename: string): boolean {
  if (!filename) return false;
  return /\d{8}/.test(filename);
}

/**
 * Get ISO week info for a date
 * Returns week year, week number, and Monday of the week
 */
export interface ISOWeekInfo {
  weekYear: number;
  weekNo: number;
  monday: Date;
}

export function getISOWeekInfo(d: Date): ISOWeekInfo {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (date.getUTCDay() + 6) % 7; // Monday=0

  // Thursday in current week decides the year
  date.setUTCDate(date.getUTCDate() - day + 3);
  const weekYear = date.getUTCFullYear();

  // Week 1 is the week with Jan 4th
  const jan4 = new Date(Date.UTC(weekYear, 0, 4));
  const jan4Day = (jan4.getUTCDay() + 6) % 7;
  const week1Start = new Date(jan4);
  week1Start.setUTCDate(jan4.getUTCDate() - jan4Day);

  const weekNo = 1 + Math.round((date.getTime() - week1Start.getTime()) / 604800000);

  // Compute Monday of this week (based on original date)
  const monday = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const monOffset = (monday.getUTCDay() + 6) % 7;
  monday.setUTCDate(monday.getUTCDate() - monOffset);

  return { weekYear, weekNo, monday };
}

/**
 * Format date for display
 */
export function formatDate(date: Date, format: 'short' | 'long' = 'short'): string {
  if (format === 'long') {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  const m = date.toLocaleString('en-US', { month: 'short' });
  const day = String(date.getDate()).padStart(2, '0');
  return `${m} ${day}`;
}

/**
 * Date pattern for extracting dates from filenames (YYYYMMDD format)
 */
export const FILENAME_DATE_PATTERN = /(\d{8})/;
