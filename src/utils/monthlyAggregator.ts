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
function parseExcelSerialDate(n: number): Date | null {
  if (!isFinite(n)) return null;
  // Excel serial date (days since 1899-12-30)
  const excelEpoch = new Date(Date.UTC(1899, 11, 30)).getTime();
  const ms = excelEpoch + n * 24 * 60 * 60 * 1000;
  const d = new Date(ms);
  return isNaN(d.getTime()) ? null : d;
}

function parseDateFromString(s: string): Date | null {
  const str = String(s).trim();
  if (!str) return null;

  // Try ISO-like YYYY-MM-DD or YYYY/MM/DD
  let m = str.match(/(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
  if (m) {
    const y = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10) - 1;
    const d = parseInt(m[3], 10);
    const date = new Date(y, mo, d);
    return isNaN(date.getTime()) ? null : date;
  }

  // Try German dd.mm.yyyy or dd/mm/yyyy
  m = str.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})/);
  if (m) {
    const d = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10) - 1;
    const yRaw = parseInt(m[3], 10);
    const y = yRaw < 100 ? 2000 + yRaw : yRaw;
    const date = new Date(y, mo, d);
    return isNaN(date.getTime()) ? null : date;
  }

  // Try compact yyyymmdd inside the string
  m = str.match(/(\d{4})(\d{2})(\d{2})/);
  if (m) {
    const y = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10) - 1;
    const d = parseInt(m[3], 10);
    const date = new Date(y, mo, d);
    return isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function parseDateValue(value: unknown): Date | null {
  if (value == null) return null;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'number') {
    // Treat as Excel serial if in plausible range; else as timestamp
    if (value > 20000 && value < 80000) {
      return parseExcelSerialDate(value);
    }
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'string') {
    return parseDateFromString(value);
  }
  return null;
}

function findDateInRow(row: any): Date | null {
  for (const key of Object.keys(row)) {
    if (key === '_sourceFileName' || key === '_sourceSheetName') continue;
    const v = row[key];
    if (typeof v === 'string') {
      const d = parseDateFromString(v);
      if (d) return d;
    } else if (typeof v === 'number') {
      const d = parseDateValue(v);
      if (d) return d;
    } else if (v instanceof Date) {
      const d = parseDateValue(v);
      if (d) return d;
    }
  }
  return null;
}

export function aggregateByMonth(
  data: any[],
  amountColumn: string,
  dateColumn?: string | null, // New optional parameter
  datePattern: RegExp = /(\d{8})/
): MonthlyAggregation {
  // Initialize monthly totals
  const monthlyTotals = new Array(12).fill(0);
  let year: number | null = null;
  let minDate: Date | null = null;
  let maxDate: Date | null = null;

  // Process each data row
  for (const row of data) {
    let date: Date | null = null;

    // 1) Try date from provided column
    if (dateColumn && row[dateColumn]) {
      date = parseDateValue(row[dateColumn]);
    }

    // 2) Fallback to parsing from metadata filename
    if (!date) {
      const fileName = row._sourceFileName || '';
      const match = fileName.match(datePattern);
      if (match) {
        const dateStr = match[1];
        const yearNum = parseInt(dateStr.substring(0, 4), 10);
        const monthNum = parseInt(dateStr.substring(4, 6), 10) - 1;
        const dayNum = parseInt(dateStr.substring(6, 8), 10);
        const d = new Date(yearNum, monthNum, dayNum);
        if (!isNaN(d.getTime())) {
          date = d;
        }
      }
    }

    // 3) Fallback to scanning other string fields (e.g., a "Source File" data column)
    if (!date) {
      date = findDateInRow(row);
    }

    if (date) {
      const yearNum = date.getFullYear();
      const monthNum = date.getMonth();

      // Update year and date range
      if (minDate === null || date < minDate) minDate = date;
      if (maxDate === null || date > maxDate) maxDate = date;
      if (year === null) year = yearNum;

      // Add amount to corresponding month
      const rawAmount = row[amountColumn];
      const amount = typeof rawAmount === 'number' ? rawAmount : parseFloat(String(rawAmount).replace(/\s/g, '')) || 0;
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
