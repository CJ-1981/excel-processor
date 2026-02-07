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
  let year = new Date().getFullYear();
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

      // Use the most recent year
      if (yearNum > year) year = yearNum;

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
  if (minDate && maxDate) {
    const startMonth = getGermanMonthName(minDate.getMonth());
    const endMonth = getGermanMonthName(maxDate.getMonth());
    dateRange = `${startMonth} - ${endMonth} ${year}`;
  } else {
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

  const numericColumns: string[] = [];

  for (const key of Object.keys(data[0])) {
    // Skip metadata columns
    if (key.startsWith('_')) continue;

    // Check if first non-null value is a number
    for (const row of data) {
      const value = row[key];
      if (value !== null && value !== undefined && value !== '') {
        if (typeof value === 'number') {
          numericColumns.push(key);
          break;
        }
        break; // Found a non-null value, stop checking this column
      }
    }
  }

  return numericColumns;
}
