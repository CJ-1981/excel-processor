import { getGermanMonthName } from './germanFormatter';

export interface MonthlyAggregation {
  jan: number;
  feb: number;
  mar: number;
  apr: number;
  may: number;
  jun: number;
  jul: number;
  aug: number;
  sep: number;
  oct: number;
  nov: number;
  dec: number;
  total: number;
  dateRange: string; // "Jan. - Dez. 2025"
  year: number;
}

/**
 * Aggregate amounts by month from data rows
 * Parses dates from _sourceFileName field (yyyymmdd format)
 */
export function aggregateByMonth(
  data: any[],
  amountColumn: string,
  datePattern: RegExp = /(\d{8})/
): MonthlyAggregation {
  // Initialize monthly totals
  const monthlyTotals = new Array(12).fill(0);
  let year: number | null = null;
  let minDate: Date | null = null;
  let maxDate: Date | null = null;

  // Process each data row
  for (const row of data) {
    const fileName = row._sourceFileName || '';
    const match = fileName.match(datePattern);

    if (match) {
      const dateStr = match[1];
      const yearNum = parseInt(dateStr.substring(0, 4), 10);
      const monthNum = parseInt(dateStr.substring(4, 6), 10) - 1; // 0-indexed
      const dayNum = parseInt(dateStr.substring(6, 8), 10);

      const date = new Date(yearNum, monthNum, dayNum);

      // Update year and date range
      if (minDate === null || date < minDate) minDate = date;
      if (maxDate === null || date > maxDate) maxDate = date;

      // Use the year from filenames (should be consistent across files)
      if (year === null) {
        year = yearNum;
      }

      // Add amount to corresponding month
      const amount = parseFloat(row[amountColumn]) || 0;
      if (monthNum >= 0 && monthNum < 12) {
        monthlyTotals[monthNum] += amount;
      }
    }
  }

  // Calculate total
  const total = monthlyTotals.reduce((sum, val) => sum + val, 0);

  // Generate date range string
  let dateRange = '';
  if (minDate && maxDate && year !== null) {
    const startMonth = getGermanMonthName(minDate.getMonth());
    const endMonth = getGermanMonthName(maxDate.getMonth());
    dateRange = `${startMonth} - ${endMonth} ${year}`;
  } else {
    // Fallback to current year if no dates found
    year = year !== null ? year : new Date().getFullYear();
    dateRange = `Jan. - Dez. ${year}`;
  }

  return {
    jan: monthlyTotals[0],
    feb: monthlyTotals[1],
    mar: monthlyTotals[2],
    apr: monthlyTotals[3],
    may: monthlyTotals[4],
    jun: monthlyTotals[5],
    jul: monthlyTotals[6],
    aug: monthlyTotals[7],
    sep: monthlyTotals[8],
    oct: monthlyTotals[9],
    nov: monthlyTotals[10],
    dec: monthlyTotals[11],
    total,
    dateRange,
    year,
  };
}

/**
 * Find all numeric columns in the data (excluding metadata columns)
 */
export function getNumericColumns(data: any[]): string[] {
  if (data.length === 0) return [];

  // Metadata columns to skip
  const skipColumns = new Set(['_sourceFileName', '_sourceSheetName']);

  const numericColumns: string[] = [];

  // Collect ALL unique keys from ALL rows (not just the first row)
  const allKeys = new Set<string>();
  for (const row of data) {
    for (const key of Object.keys(row)) {
      allKeys.add(key);
    }
  }

  for (const key of allKeys) {
    // Skip metadata columns
    if (skipColumns.has(key)) continue;

    // Check if any non-null value in this column is a number
    for (const row of data) {
      const value = row[key];
      if (value !== null && value !== undefined && value !== '') {
        if (typeof value === 'number') {
          numericColumns.push(key);
          break;
        }
        break; // Found a non-null value that's not a number, stop checking this column
      }
    }
  }

  return numericColumns;
}
