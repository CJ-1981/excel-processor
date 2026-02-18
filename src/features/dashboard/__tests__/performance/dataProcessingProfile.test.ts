/**
 * Data Processing Utilities Profile Test Suite
 * TASK-002: Profile data processing utilities to identify performance bottlenecks
 *
 * This suite measures actual performance of dashboard utility functions to:
 * 1. Establish baseline metrics for each utility function
 * 2. Identify performance bottlenecks
 * 3. Ensure performance meets requirements for datasets up to 100K rows
 *
 * Test Data Sizes:
 * - Small: 1,000 rows (typical dataset)
 * - Medium: 10,000 rows (large dataset)
 * - Large: 100,000 rows (stress test per REQ-PERF-005)
 */

import { describe, it } from 'vitest';
import { runBenchmark, formatBenchmarkResult, assertBenchmark, generateTestData } from '../utils/benchmarkHelpers';

// Import utility functions to profile
import {
  formatChartValue,
  formatCompactNumber,
  formatTooltipValue,
  calculatePercentage,
  sortByDate,
  aggregateByTimeMultiple,
} from '../../utils/chartCalculations';

import {
  parseDateValue,
  extractDateFromFilename,
  hasFilenameDate,
  getISOWeekInfo,
} from '../../utils/dateExtraction';

import {
  analyzeDataForDashboard,
  calculateColumnStatistics,
  calculatePercentile,
  calculateDistribution,
  getTopItems,
} from '../../utils/dataAnalysis';

describe('Performance: Data Processing Utilities Profile', () => {
  /**
   * Chart Calculations Utilities
   */
  describe('Chart Calculations: formatChartValue', () => {
    it('should format 1K values in under 5ms', async () => {
      const values = Array.from({ length: 1000 }, (_, i) => i * 1.2345);

      const result = await runBenchmark(
        () => {
          values.forEach(v => formatChartValue(v, 2));
          return true;
        },
        {
          name: 'formatChartValue - 1K values',
          threshold: 5,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });

    it('should format 10K values in under 50ms', async () => {
      const values = Array.from({ length: 10000 }, (_, i) => i * 1.2345);

      const result = await runBenchmark(
        () => {
          values.forEach(v => formatChartValue(v, 2));
          return true;
        },
        {
          name: 'formatChartValue - 10K values',
          threshold: 50,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });
  });

  describe('Chart Calculations: formatCompactNumber', () => {
    it('should format 1K values in under 10ms', async () => {
      const values = Array.from({ length: 1000 }, (_, i) => i * 12345);

      const result = await runBenchmark(
        () => {
          values.forEach(v => formatCompactNumber(v));
          return true;
        },
        {
          name: 'formatCompactNumber - 1K values',
          threshold: 10,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });

    it('should format 100K values in under 100ms', async () => {
      const values = Array.from({ length: 100000 }, (_, i) => i * 12345);

      const result = await runBenchmark(
        () => {
          values.forEach(v => formatCompactNumber(v));
          return true;
        },
        {
          name: 'formatCompactNumber - 100K values',
          threshold: 100,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });
  });

  describe('Chart Calculations: formatTooltipValue', () => {
    it('should format 1K values in under 10ms', async () => {
      const values = Array.from({ length: 1000 }, (_, i) => i * 12345);

      const result = await runBenchmark(
        () => {
          values.forEach(v => formatTooltipValue(v));
          return true;
        },
        {
          name: 'formatTooltipValue - 1K values',
          threshold: 10,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });
  });

  describe('Chart Calculations: calculatePercentage', () => {
    it('should calculate 1K percentages in under 5ms', async () => {
      const values = Array.from({ length: 1000 }, (_, i) => i);
      const total = values.reduce((a, b) => a + b, 0);

      const result = await runBenchmark(
        () => {
          values.forEach(v => calculatePercentage(v, total));
          return true;
        },
        {
          name: 'calculatePercentage - 1K values',
          threshold: 5,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });
  });

  describe('Chart Calculations: sortByDate', () => {
    it('should sort 1K date records in under 10ms', async () => {
      const data = Array.from({ length: 1000 }, (_, i) => ({
        date: new Date(2025, 0, (i * 7) % 365),
      }));

      const result = await runBenchmark(
        () => sortByDate(data),
        {
          name: 'sortByDate - 1K records',
          threshold: 10,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });

    it('should sort 10K date records in under 50ms', async () => {
      const data = Array.from({ length: 10000 }, (_, i) => ({
        date: new Date(2025, 0, (i * 7) % 365),
      }));

      const result = await runBenchmark(
        () => sortByDate(data),
        {
          name: 'sortByDate - 10K records',
          threshold: 50,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });

    it('should sort 100K date records in under 200ms', async () => {
      const data = Array.from({ length: 100000 }, (_, i) => ({
        date: new Date(2025, 0, (i * 7) % 365),
      }));

      const result = await runBenchmark(
        () => sortByDate(data),
        {
          name: 'sortByDate - 100K records',
          threshold: 200,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });
  });

  describe('Chart Calculations: aggregateByTimeMultiple', () => {
    it('should aggregate 1K rows by time periods in under 100ms', async () => {
      const data = generateTestData(1000);
      const dateColumn = 'date';
      const valueColumns = ['amount'];

      const result = await runBenchmark(
        () => aggregateByTimeMultiple(data, dateColumn, valueColumns, parseDateValue),
        {
          name: 'aggregateByTimeMultiple - 1K rows',
          threshold: 100,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });

    it('should aggregate 10K rows by time periods in under 150ms', async () => {
      const data = generateTestData(10000);
      const dateColumn = 'date';
      const valueColumns = ['amount'];

      const result = await runBenchmark(
        () => aggregateByTimeMultiple(data, dateColumn, valueColumns, parseDateValue),
        {
          name: 'aggregateByTimeMultiple - 10K rows',
          threshold: 150,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });

    it('should aggregate 100K rows by time periods in under 600ms per REQ-PERF-005', async () => {
      const data = generateTestData(100000);
      const dateColumn = 'date';
      const valueColumns = ['amount'];

      const result = await runBenchmark(
        () => aggregateByTimeMultiple(data, dateColumn, valueColumns, parseDateValue),
        {
          name: 'aggregateByTimeMultiple - 100K rows',
          threshold: 600,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });

    it('should aggregate 10K rows with multiple value columns in under 150ms', async () => {
      const data = generateTestData(10000).map(row => ({
        ...row,
        amount2: row.amount * 1.5,
        amount3: row.amount * 2,
      }));
      const dateColumn = 'date';
      const valueColumns = ['amount', 'amount2', 'amount3'];

      const result = await runBenchmark(
        () => aggregateByTimeMultiple(data, dateColumn, valueColumns, parseDateValue),
        {
          name: 'aggregateByTimeMultiple - 10K rows, 3 columns',
          threshold: 150,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });
  });

  /**
   * Date Extraction Utilities
   */
  describe('Date Extraction: parseDateValue', () => {
    it('should parse 1K date strings in under 20ms', async () => {
      const dates = Array.from({ length: 1000 }, (_, i) => {
        const date = new Date(2025, 0, (i % 28) + 1);
        return date.toISOString().split('T')[0]; // YYYY-MM-DD format
      });

      const result = await runBenchmark(
        () => {
          dates.forEach(d => parseDateValue(d));
          return true;
        },
        {
          name: 'parseDateValue - 1K dates (ISO format)',
          threshold: 20,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });

    it('should parse 10K date strings in under 100ms', async () => {
      const dates = Array.from({ length: 10000 }, (_, i) => {
        const date = new Date(2025, 0, (i % 28) + 1);
        return date.toISOString().split('T')[0];
      });

      const result = await runBenchmark(
        () => {
          dates.forEach(d => parseDateValue(d));
          return true;
        },
        {
          name: 'parseDateValue - 10K dates',
          threshold: 100,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });

    it('should parse 1K German format dates (DD.MM.YYYY) in under 30ms', async () => {
      const dates = Array.from({ length: 1000 }, (_, i) => {
        const day = String((i % 28) + 1).padStart(2, '0');
        const month = String((i % 12) + 1).padStart(2, '0');
        return `${day}.${month}.2025`;
      });

      const result = await runBenchmark(
        () => {
          dates.forEach(d => parseDateValue(d));
          return true;
        },
        {
          name: 'parseDateValue - 1K dates (German format)',
          threshold: 30,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });
  });

  describe('Date Extraction: extractDateFromFilename', () => {
    it('should extract dates from 1K filenames in under 10ms', async () => {
      const filenames = Array.from({ length: 1000 }, (_, i) =>
        `data_202501${String(i % 28 + 1).padStart(2, '0')}.csv`
      );

      const result = await runBenchmark(
        () => {
          filenames.forEach(f => extractDateFromFilename(f));
          return true;
        },
        {
          name: 'extractDateFromFilename - 1K filenames',
          threshold: 10,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });
  });

  describe('Date Extraction: hasFilenameDate', () => {
    it('should check 10K filenames for date pattern in under 20ms', async () => {
      const filenames = Array.from({ length: 10000 }, (_, i) =>
        `data_202501${String(i % 28 + 1).padStart(2, '0')}.csv`
      );

      const result = await runBenchmark(
        () => {
          filenames.forEach(f => hasFilenameDate(f));
          return true;
        },
        {
          name: 'hasFilenameDate - 10K filenames',
          threshold: 20,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });
  });

  describe('Date Extraction: getISOWeekInfo', () => {
    it('should calculate ISO week info for 1K dates in under 15ms', async () => {
      const dates = Array.from({ length: 1000 }, (_, i) =>
        new Date(2025, 0, (i * 7) % 365)
      );

      const result = await runBenchmark(
        () => {
          dates.forEach(d => getISOWeekInfo(d));
          return true;
        },
        {
          name: 'getISOWeekInfo - 1K dates',
          threshold: 15,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });

    it('should calculate ISO week info for 10K dates in under 100ms', async () => {
      const dates = Array.from({ length: 10000 }, (_, i) =>
        new Date(2025, 0, (i * 7) % 365)
      );

      const result = await runBenchmark(
        () => {
          dates.forEach(d => getISOWeekInfo(d));
          return true;
        },
        {
          name: 'getISOWeekInfo - 10K dates',
          threshold: 100,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });
  });

  /**
   * Data Analysis Utilities
   */
  describe('Data Analysis: calculateColumnStatistics', () => {
    it('should calculate statistics for 1K rows in under 50ms', async () => {
      const data = generateTestData(1000);

      const result = await runBenchmark(
        () => calculateColumnStatistics(data, 'amount', 'Amount'),
        {
          name: 'calculateColumnStatistics - 1K rows',
          threshold: 50,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });

    it('should calculate statistics for 10K rows in under 200ms', async () => {
      const data = generateTestData(10000);

      const result = await runBenchmark(
        () => calculateColumnStatistics(data, 'amount', 'Amount'),
        {
          name: 'calculateColumnStatistics - 10K rows',
          threshold: 200,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });

    it('should calculate statistics for 100K rows in under 1000ms', async () => {
      const data = generateTestData(100000);

      const result = await runBenchmark(
        () => calculateColumnStatistics(data, 'amount', 'Amount'),
        {
          name: 'calculateColumnStatistics - 100K rows',
          threshold: 1000,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });
  });

  describe('Data Analysis: calculatePercentile', () => {
    it('should calculate percentile for 1K sorted values in under 5ms', async () => {
      const sortedValues = Array.from({ length: 1000 }, (_, i) => i).sort((a, b) => a - b);

      const result = await runBenchmark(
        () => {
          calculatePercentile(sortedValues, 50);
          calculatePercentile(sortedValues, 90);
          calculatePercentile(sortedValues, 95);
          return true;
        },
        {
          name: 'calculatePercentile - 1K values, 3 calculations',
          threshold: 5,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });

    it('should calculate percentile for 100K sorted values in under 10ms', async () => {
      const sortedValues = Array.from({ length: 100000 }, (_, i) => i).sort((a, b) => a - b);

      const result = await runBenchmark(
        () => calculatePercentile(sortedValues, 95),
        {
          name: 'calculatePercentile - 100K values',
          threshold: 10,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });
  });

  describe('Data Analysis: calculateDistribution', () => {
    it('should calculate distribution for 1K rows in under 30ms', async () => {
      const data = generateTestData(1000);

      const result = await runBenchmark(
        () => calculateDistribution(data, 'category'),
        {
          name: 'calculateDistribution - 1K rows',
          threshold: 30,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });

    it('should calculate distribution for 10K rows in under 100ms', async () => {
      const data = generateTestData(10000);

      const result = await runBenchmark(
        () => calculateDistribution(data, 'category'),
        {
          name: 'calculateDistribution - 10K rows',
          threshold: 100,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });
  });

  describe('Data Analysis: getTopItems', () => {
    it('should get top 10 items from 1K rows in under 20ms', async () => {
      const data = generateTestData(1000);
      const distribution = calculateDistribution(data, 'donorName', 'amount');

      const result = await runBenchmark(
        () => getTopItems(distribution, 10),
        {
          name: 'getTopItems - 1K rows, top 10',
          threshold: 20,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });

    it('should get top 100 items from 10K rows in under 50ms', async () => {
      const data = generateTestData(10000);
      const distribution = calculateDistribution(data, 'donorName', 'amount');

      const result = await runBenchmark(
        () => getTopItems(distribution, 100),
        {
          name: 'getTopItems - 10K rows, top 100',
          threshold: 50,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });
  });

  describe('Data Analysis: analyzeDataForDashboard (End-to-End)', () => {
    const columnMapping = {
      _sourceFileName: 'Source File',
      _sourceSheetName: 'Source Sheet',
      donorName: 'Donor Name',
      amount: 'Amount',
      date: 'Date',
      category: 'Category',
    };

    it('should analyze 1K rows for dashboard in under 200ms', async () => {
      const data = generateTestData(1000);

      const result = await runBenchmark(
        () => analyzeDataForDashboard(data, columnMapping, 'donorName'),
        {
          name: 'analyzeDataForDashboard - 1K rows',
          threshold: 200,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });

    it('should analyze 10K rows for dashboard in under 1000ms', async () => {
      const data = generateTestData(10000);

      const result = await runBenchmark(
        () => analyzeDataForDashboard(data, columnMapping, 'donorName'),
        {
          name: 'analyzeDataForDashboard - 10K rows',
          threshold: 1000,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });

    it('should analyze 100K rows for dashboard in under 5000ms', async () => {
      const data = generateTestData(100000);

      const result = await runBenchmark(
        () => analyzeDataForDashboard(data, columnMapping, 'donorName'),
        {
          name: 'analyzeDataForDashboard - 100K rows',
          threshold: 5000,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });
  });

  /**
   * Combined Operations Profile
   * Tests realistic workflows combining multiple utilities
   */
  describe('Combined Operations: Realistic Workflows', () => {
    const columnMapping = {
      _sourceFileName: 'Source File',
      _sourceSheetName: 'Source Sheet',
      donorName: 'Donor Name',
      amount: 'Amount',
      date: 'Date',
      category: 'Category',
    };

    it('should process 1K rows through full pipeline in under 300ms', async () => {
      const data = generateTestData(1000);
      const dateCol = 'date';
      const valueCols = ['amount'];

      const result = await runBenchmark(
        () => {
          // Full dashboard analysis pipeline
          const analysis = analyzeDataForDashboard(data, columnMapping, 'donorName');

          // Time aggregation for trend charts
          aggregateByTimeMultiple(data, dateCol, valueCols, parseDateValue);

          // Get top contributors
          const distribution = calculateDistribution(data, 'donorName', 'amount');
          const topDonors = getTopItems(distribution, 10);

          return { analysis, topDonors };
        },
        {
          name: 'Full pipeline - 1K rows',
          threshold: 300,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });

    it('should process 10K rows through full pipeline in under 1500ms', async () => {
      const data = generateTestData(10000);
      const dateCol = 'date';
      const valueCols = ['amount'];

      const result = await runBenchmark(
        () => {
          const analysis = analyzeDataForDashboard(data, columnMapping, 'donorName');

          // Time aggregation for trend charts
          aggregateByTimeMultiple(data, dateCol, valueCols, parseDateValue);

          // Get top contributors
          const distribution = calculateDistribution(data, 'donorName', 'amount');
          const topDonors = getTopItems(distribution, 10);

          return { analysis, topDonors };
        },
        {
          name: 'Full pipeline - 10K rows',
          threshold: 1500,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });
  });
});
