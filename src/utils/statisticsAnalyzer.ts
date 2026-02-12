import type { ColumnStatistics, TimeSeriesDataPoint, CategoryDistribution, DashboardAnalysis, HistogramData, HistogramBin, Quartiles, ParetoDataPoint, RangeDistributionData, ValueRange } from '../types';

/**
 * Calculate a specific percentile of a sorted array
 * @param sortedValues - Array of values sorted in ascending order
 * @param percentile - Percentile to calculate (0-100)
 */
export function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0];

  const index = (percentile / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const fraction = index - lower;

  if (lower === upper) {
    return sortedValues[lower];
  }

  return sortedValues[lower] * (1 - fraction) + sortedValues[upper] * fraction;
}

/**
 * Calculate basic statistics for a numeric column
 */
export function calculateColumnStatistics(
  data: any[],
  columnKey: string,
  columnLabel: string
): ColumnStatistics {
  // Extract numeric values
  const values: number[] = [];
  data.forEach(row => {
    const value = row[columnKey];
    if (value !== null && value !== undefined && value !== '') {
      const numValue = typeof value === 'number' ? value : parseFloat(String(value));
      if (!isNaN(numValue)) {
        values.push(numValue);
      }
    }
  });

  if (values.length === 0) {
    return {
      columnName: columnKey,
      columnLabel,
      sum: 0,
      avg: 0,
      min: 0,
      max: 0,
      median: 0,
      stdDev: 0,
      count: data.length,
      nonNullCount: 0,
      percentile25: 0,
      percentile75: 0,
      percentile90: 0,
      percentile95: 0,
    };
  }

  // Calculate statistics
  const sum = values.reduce((acc, val) => acc + val, 0);
  const avg = sum / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  // Calculate median
  const sortedValues = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sortedValues.length / 2);
  const median = sortedValues.length % 2 !== 0
    ? sortedValues[mid]
    : (sortedValues[mid - 1] + sortedValues[mid]) / 2;

  // Calculate standard deviation
  const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
  const avgSquaredDiff = squaredDiffs.reduce((acc, val) => acc + val, 0) / values.length;
  const stdDev = Math.sqrt(avgSquaredDiff);

  // Calculate percentiles using sorted values
  const percentile25 = calculatePercentile(sortedValues, 25);
  const percentile75 = calculatePercentile(sortedValues, 75);
  const percentile90 = calculatePercentile(sortedValues, 90);
  const percentile95 = calculatePercentile(sortedValues, 95);

  return {
    columnName: columnKey,
    columnLabel,
    sum,
    avg,
    min,
    max,
    median,
    stdDev,
    count: data.length,
    nonNullCount: values.length,
    percentile25,
    percentile75,
    percentile90,
    percentile95,
  };
}

/**
 * Detect numeric columns in the dataset
 * Checks if values can be parsed as numbers (handles both number type and string numbers)
 */
export function detectNumericColumns(data: any[]): string[] {
  if (data.length === 0) return [];

  // Metadata columns to skip (internal use only)
  const skipColumns = new Set(['_sourceFileName', '_sourceSheetName']);

  const columnValueCounts = new Map<string, { numeric: number; total: number }>();

  // Check all rows for all columns
  data.forEach(row => {
    Object.keys(row).forEach(key => {
      if (skipColumns.has(key)) return; // Skip specific metadata columns

      if (!columnValueCounts.has(key)) {
        columnValueCounts.set(key, { numeric: 0, total: 0 });
      }

      const counts = columnValueCounts.get(key)!;
      const value = row[key];

      if (value !== null && value !== undefined && value !== '') {
        counts.total++;

        // Check if it's a number type or parseable string
        if (typeof value === 'number') {
          counts.numeric++;
        } else if (typeof value === 'string') {
          const trimmed = value.trim();
          // Check if it's a valid number (not empty, not NaN after parse)
          if (trimmed !== '' && !isNaN(parseFloat(trimmed))) {
            counts.numeric++;
          }
        }
      }
    });
  });

  // A column is numeric if at least 50% of its non-null values are numeric
  const numericColumns: string[] = [];
  columnValueCounts.forEach((counts, key) => {
    if (counts.total > 0 && counts.numeric / counts.total >= 0.5) {
      numericColumns.push(key);
    }
  });

  return numericColumns;
}

/**
 * Detect date columns in the dataset
 * Returns column keys that appear to contain dates
 */
export function detectDateColumns(data: any[]): string[] {
  if (data.length === 0) return [];

  // Metadata columns to skip (internal use only)
  const skipColumns = new Set(['_sourceFileName', '_sourceSheetName']);

  const dateColumns: string[] = [];
  const checkedColumns = new Set<string>();

  // Common date patterns
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY or DD/MM/YYYY
    /^\d{2}\.\d{2}\.\d{4}$/, // DD.MM.YYYY (German)
    /^\d{8}$/, // YYYYMMDD
  ];

  data.forEach(row => {
    Object.keys(row).forEach(key => {
      if (skipColumns.has(key)) return;
      if (checkedColumns.has(key)) return;

      const value = row[key];
      if (value !== null && value !== undefined && value !== '') {
        // Check if it's a Date object
        if (value instanceof Date) {
          if (!dateColumns.includes(key)) {
            dateColumns.push(key);
          }
          checkedColumns.add(key);
          return;
        }

        // Check if it's a string matching date patterns
        if (typeof value === 'string') {
          const matchesPattern = datePatterns.some(pattern => pattern.test(value.trim()));
          if (matchesPattern) {
            if (!dateColumns.includes(key)) {
              dateColumns.push(key);
            }
            checkedColumns.add(key);
            return;
          }
        }
      }
    });
  });

  return dateColumns;
}

/**
 * Parse a date value from various formats
 */
export function parseDate(value: any): Date | null {
  if (value instanceof Date) return value;
  if (typeof value !== 'string') return null;

  const strValue = value.trim();

  // Try YYYYMMDD format
  if (/^\d{8}$/.test(strValue)) {
    const year = parseInt(strValue.substring(0, 4), 10);
    const month = parseInt(strValue.substring(4, 6), 10) - 1;
    const day = parseInt(strValue.substring(6, 8), 10);
    return new Date(year, month, day);
  }

  // Try ISO format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(strValue)) {
    return new Date(strValue);
  }

  // Try German format (DD.MM.YYYY)
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(strValue)) {
    const parts = strValue.split('.');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }

  // Try slash format (MM/DD/YYYY or DD/MM/YYYY)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(strValue)) {
    const parts = strValue.split('/');
    // Assume DD/MM/YYYY (more common in Europe)
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }

  return null;
}

/**
 * Aggregate data by time period (monthly, quarterly, yearly)
 */
export function aggregateByTime(
  data: any[],
  dateColumn: string,
  valueColumn: string,
  period: 'monthly' | 'quarterly' | 'yearly'
): TimeSeriesDataPoint[] {
  const aggregated = new Map<string, { value: number; count: number; date: Date }>();

  data.forEach(row => {
    const date = parseDate(row[dateColumn]);
    if (!date) return;

    const value = parseFloat(row[valueColumn]) || 0;

    let periodKey: string;
    let periodDate: Date;

    switch (period) {
      case 'monthly':
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        periodDate = new Date(date.getFullYear(), date.getMonth(), 1);
        break;
      case 'quarterly':
        const quarter = Math.floor(date.getMonth() / 3);
        periodKey = `${date.getFullYear()}-Q${quarter + 1}`;
        periodDate = new Date(date.getFullYear(), quarter * 3, 1);
        break;
      case 'yearly':
        periodKey = `${date.getFullYear()}`;
        periodDate = new Date(date.getFullYear(), 0, 1);
        break;
    }

    if (!aggregated.has(periodKey)) {
      aggregated.set(periodKey, { value: 0, count: 0, date: periodDate });
    }

    const entry = aggregated.get(periodKey)!;
    entry.value += value;
    entry.count += 1;
  });

  // Convert to array and sort by date
  const result = Array.from(aggregated.entries())
    .map(([period, data]) => ({
      period,
      value: data.value,
      count: data.count,
      date: data.date,
    }))
    .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));

  return result;
}

/**
 * Calculate category distribution for a column
 */
export function calculateDistribution(
  data: any[],
  categoryColumn: string,
  valueColumn?: string
): CategoryDistribution[] {
  const distribution = new Map<string, { value: number; count: number }>();

  data.forEach(row => {
    const category = row[categoryColumn];
    if (category === null || category === undefined || category === '') return;

    const categoryKey = String(category);
    const value = valueColumn ? (parseFloat(row[valueColumn]) || 0) : 1;

    if (!distribution.has(categoryKey)) {
      distribution.set(categoryKey, { value: 0, count: 0 });
    }

    const entry = distribution.get(categoryKey)!;
    entry.value += value;
    entry.count += 1;
  });

  // Calculate total for percentages
  const total = Array.from(distribution.values()).reduce((sum, entry) => sum + entry.value, 0);

  // Convert to array and sort by value (descending)
  const result = Array.from(distribution.entries())
    .map(([category, data]) => ({
      category,
      value: data.value,
      count: data.count,
      percentage: total > 0 ? (data.value / total) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  return result;
}

/**
 * Get top N items by value
 */
export function getTopItems(
  data: CategoryDistribution[],
  limit: number = 10
): CategoryDistribution[] {
  return data.slice(0, limit);
}

/**
 * Analyze data and generate dashboard statistics
 */
export function analyzeDataForDashboard(
  data: any[],
  columnMapping: Record<string, string>,
  nameColumn?: string | null
): DashboardAnalysis {
  // Detect column types
  const numericColumns = detectNumericColumns(data);
  const dateColumns = detectDateColumns(data);

  // Calculate statistics for all numeric columns
  const numericColumnStats = numericColumns.map(colKey =>
    calculateColumnStatistics(data, colKey, columnMapping[colKey] || colKey)
  );

  // Calculate time series if we have both date and numeric columns
  const timeSeries: DashboardAnalysis['timeSeries'] = {};

  if (dateColumns.length > 0 && numericColumns.length > 0) {
    const dateCol = dateColumns[0];
    const valueCol = numericColumns[0]; // Use first numeric column

    timeSeries.monthly = aggregateByTime(data, dateCol, valueCol, 'monthly');
    timeSeries.quarterly = aggregateByTime(data, dateCol, valueCol, 'quarterly');
    timeSeries.yearly = aggregateByTime(data, dateCol, valueCol, 'yearly');
  }

  // Calculate distributions
  const distributions: DashboardAnalysis['distributions'] = {};

  // Distribution by name (if name column exists)
  if (nameColumn && numericColumns.length > 0) {
    distributions.byName = calculateDistribution(data, nameColumn, numericColumns[0]);
  }

  // Distribution by source file
  if (data.length > 0 && '_sourceFileName' in data[0]) {
    distributions.bySource = calculateDistribution(data, '_sourceFileName', numericColumns[0]);
  }

  // Get top donors (top 10 by value)
  const topDonors = distributions.byName
    ? getTopItems(distributions.byName, 10)
    : [];

  // Calculate metadata
  const metadata: DashboardAnalysis['metadata'] = {
    totalRows: data.length,
    filteredRows: data.length,
  };

  // Extract date range if available
  if (dateColumns.length > 0) {
    const dates = data
      .map(row => parseDate(row[dateColumns[0]]))
      .filter((date): date is Date => date !== null)
      .sort((a, b) => a.getTime() - b.getTime());

    if (dates.length > 0) {
      metadata.dateRange = {
        start: dates[0],
        end: dates[dates.length - 1],
      };
    }
  }

  return {
    numericColumns: numericColumnStats,
    timeSeries,
    distributions,
    topDonors,
    metadata,
  };
}

/**
 * Extract numeric values from a column
 */
export function extractNumericValues(data: any[], columnKey: string): number[] {
  const values: number[] = [];
  data.forEach(row => {
    const value = row[columnKey];
    if (value !== null && value !== undefined && value !== '') {
      const numValue = typeof value === 'number' ? value : parseFloat(String(value));
      if (!isNaN(numValue)) {
        values.push(numValue);
      }
    }
  });
  return values;
}

/**
 * Calculate histogram data for distribution visualization
 */
export function calculateHistogram(
  values: number[],
  binCount: number = 10
): HistogramData {
  if (values.length === 0) {
    return {
      bins: [],
      mean: 0,
      median: 0,
      min: 0,
      max: 0,
    };
  }

  const sortedValues = [...values].sort((a, b) => a - b);
  const min = sortedValues[0];
  const max = sortedValues[sortedValues.length - 1];
  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = sum / values.length;

  // Calculate median
  const mid = Math.floor(sortedValues.length / 2);
  const median = sortedValues.length % 2 !== 0
    ? sortedValues[mid]
    : (sortedValues[mid - 1] + sortedValues[mid]) / 2;

  // Handle case where all values are the same
  if (min === max) {
    return {
      bins: [{
        binStart: min,
        binEnd: max,
        count: values.length,
        label: `${min.toFixed(2)}`,
      }],
      mean,
      median,
      min,
      max,
    };
  }

  // Calculate bin width
  const range = max - min;
  const binWidth = range / binCount;

  // Create bins
  const bins: HistogramBin[] = [];
  for (let i = 0; i < binCount; i++) {
    const binStart = min + i * binWidth;
    const binEnd = i === binCount - 1 ? max : min + (i + 1) * binWidth;

    bins.push({
      binStart,
      binEnd,
      count: 0,
      label: `${binStart.toFixed(0)}-${binEnd.toFixed(0)}`,
    });
  }

  // Count values in each bin
  values.forEach(value => {
    // Find the appropriate bin
    let binIndex = Math.floor((value - min) / binWidth);
    // Handle edge case for max value
    if (binIndex >= binCount) {
      binIndex = binCount - 1;
    }
    bins[binIndex].count++;
  });

  return {
    bins,
    mean,
    median,
    min,
    max,
  };
}

/**
 * Calculate quartiles and outliers for box plot
 */
export function calculateQuartiles(values: number[]): Quartiles {
  if (values.length === 0) {
    return {
      min: 0,
      q1: 0,
      median: 0,
      q3: 0,
      max: 0,
      iqr: 0,
      outliers: [],
    };
  }

  const sortedValues = [...values].sort((a, b) => a - b);

  const q1 = calculatePercentile(sortedValues, 25);
  const median = calculatePercentile(sortedValues, 50);
  const q3 = calculatePercentile(sortedValues, 75);
  const iqr = q3 - q1;

  // Calculate whiskers (1.5 * IQR rule)
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;

  // Find actual min/max within whiskers
  const whiskerMin = sortedValues.find(v => v >= lowerFence) || sortedValues[0];
  const whiskerMax = [...sortedValues].reverse().find(v => v <= upperFence) || sortedValues[sortedValues.length - 1];

  // Find outliers
  const outliers = sortedValues.filter(v => v < lowerFence || v > upperFence);

  return {
    min: whiskerMin,
    q1,
    median,
    q3,
    max: whiskerMax,
    iqr,
    outliers,
  };
}

/**
 * Calculate Pareto analysis data (80/20 rule)
 */
export function calculatePareto(
  distribution: CategoryDistribution[]
): ParetoDataPoint[] {
  if (distribution.length === 0) {
    return [];
  }

  // Sort by value descending (should already be sorted, but ensure)
  const sorted = [...distribution].sort((a, b) => b.value - a.value);

  // Calculate total
  const total = sorted.reduce((sum, item) => sum + item.value, 0);

  // Calculate cumulative values and percentages
  let cumulativeValue = 0;
  return sorted.map(item => {
    cumulativeValue += item.value;
    return {
      category: item.category,
      value: item.value,
      cumulativeValue,
      cumulativePercentage: total > 0 ? (cumulativeValue / total) * 100 : 0,
    };
  });
}

/**
 * Default value ranges for distribution analysis
 */
export const DEFAULT_VALUE_RANGES: ValueRange[] = [
  { label: '0', min: 0, max: 0 },
  { label: '1-50', min: 1, max: 50 },
  { label: '51-100', min: 51, max: 100 },
  { label: '101-200', min: 101, max: 200 },
  { label: '201-500', min: 201, max: 500 },
  { label: '501-1000', min: 501, max: 1000 },
  { label: '1001+', min: 1001, max: Infinity },
];

/**
 * Calculate range distribution for pie charts
 */
export function calculateRangeDistribution(
  values: number[],
  ranges: ValueRange[] = DEFAULT_VALUE_RANGES
): RangeDistributionData[] {
  if (values.length === 0) {
    return [];
  }

  const totalAmount = values.reduce((sum, val) => sum + val, 0);

  // Initialize counts for each range
  const rangeCounts: Map<string, { count: number; amount: number }> = new Map();
  ranges.forEach(range => {
    rangeCounts.set(range.label, { count: 0, amount: 0 });
  });

  // Categorize each value into a range
  values.forEach(value => {
    for (const range of ranges) {
      if (value >= range.min && value <= range.max) {
        const entry = rangeCounts.get(range.label)!;
        entry.count++;
        entry.amount += value;
        break;
      }
    }
  });

  // Convert to array and filter out empty ranges
  return Array.from(rangeCounts.entries())
    .filter(([, data]) => data.count > 0)
    .map(([label, data]) => ({
      label,
      count: data.count,
      amount: data.amount,
      percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
    }));
}
