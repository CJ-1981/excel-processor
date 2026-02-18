/**
 * Performance Benchmark Test Suite
 * Main entry point for all performance benchmarks
 */

import { describe, it } from 'vitest';
import { runBenchmark, formatBenchmarkResult, assertBenchmark, generateTestData, type TestRow } from '../utils/benchmarkHelpers';

describe('Performance: Benchmark Suite', () => {
  describe('Data Processing Performance', () => {
    it('should process 1K rows in under 50ms', async () => {
      const data = generateTestData(1000);

      const result = await runBenchmark(
        () => {
          // Simulate data processing
          const processed = data.map((row) => ({
            ...row,
            processed: true,
            amountDouble: row.amount * 2,
          }));
          return processed;
        },
        {
          name: 'Process 1K rows',
          threshold: 50,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });

    it('should process 10K rows in under 200ms', async () => {
      const data = generateTestData(10000);

      const result = await runBenchmark(
        () => {
          const processed = data.map((row) => ({
            ...row,
            processed: true,
            amountDouble: row.amount * 2,
          }));
          return processed;
        },
        {
          name: 'Process 10K rows',
          threshold: 200,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });

    it('should process 100K rows in under 1000ms', async () => {
      const data = generateTestData(100000);

      const result = await runBenchmark(
        () => {
          const processed = data.map((row) => ({
            ...row,
            processed: true,
            amountDouble: row.amount * 2,
          }));
          return processed;
        },
        {
          name: 'Process 100K rows',
          threshold: 1000,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });
  });

  describe('Data Aggregation Performance', () => {
    it('should aggregate 1K rows by category in under 20ms', async () => {
      const data = generateTestData(1000);

      const result = await runBenchmark(
        () => {
          const aggregated = data.reduce((acc: Record<string, { count: number; total: number }>, row: TestRow) => {
            const category = row.category;
            if (!acc[category]) {
              acc[category] = { count: 0, total: 0 };
            }
            acc[category].count++;
            acc[category].total += row.amount;
            return acc;
          }, {} as Record<string, { count: number; total: number }>);
          return aggregated;
        },
        {
          name: 'Aggregate 1K rows',
          threshold: 20,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });

    it('should aggregate 10K rows by category in under 100ms', async () => {
      const data = generateTestData(10000);

      const result = await runBenchmark(
        () => {
          const aggregated = data.reduce((acc: Record<string, { count: number; total: number }>, row: TestRow) => {
            const category = row.category;
            if (!acc[category]) {
              acc[category] = { count: 0, total: 0 };
            }
            acc[category].count++;
            acc[category].total += row.amount;
            return acc;
          }, {} as Record<string, { count: number; total: number }>);
          return aggregated;
        },
        {
          name: 'Aggregate 10K rows',
          threshold: 100,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });

    it('should aggregate 100K rows by category in under 500ms', async () => {
      const data = generateTestData(100000);

      const result = await runBenchmark(
        () => {
          const aggregated = data.reduce((acc: Record<string, { count: number; total: number }>, row: TestRow) => {
            const category = row.category;
            if (!acc[category]) {
              acc[category] = { count: 0, total: 0 };
            }
            acc[category].count++;
            acc[category].total += row.amount;
            return acc;
          }, {} as Record<string, { count: number; total: number }>);
          return aggregated;
        },
        {
          name: 'Aggregate 100K rows',
          threshold: 500,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });
  });

  describe('Filtering Performance', () => {
    it('should filter 1K rows in under 10ms', async () => {
      const data = generateTestData(1000);

      const result = await runBenchmark(
        () => {
          const filtered = data.filter((row) => row.amount > 500);
          return filtered;
        },
        {
          name: 'Filter 1K rows',
          threshold: 10,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });

    it('should filter 10K rows in under 50ms', async () => {
      const data = generateTestData(10000);

      const result = await runBenchmark(
        () => {
          const filtered = data.filter((row) => row.amount > 500);
          return filtered;
        },
        {
          name: 'Filter 10K rows',
          threshold: 50,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });

    it('should filter 100K rows in under 200ms', async () => {
      const data = generateTestData(100000);

      const result = await runBenchmark(
        () => {
          const filtered = data.filter((row) => row.amount > 500);
          return filtered;
        },
        {
          name: 'Filter 100K rows',
          threshold: 200,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });
  });

  describe('Sorting Performance', () => {
    it('should sort 1K rows in under 20ms', async () => {
      const data = generateTestData(1000);

      const result = await runBenchmark(
        () => {
          const sorted = [...data].sort((a, b) => b.amount - a.amount);
          return sorted;
        },
        {
          name: 'Sort 1K rows',
          threshold: 20,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });

    it('should sort 10K rows in under 100ms', async () => {
      const data = generateTestData(10000);

      const result = await runBenchmark(
        () => {
          const sorted = [...data].sort((a, b) => b.amount - a.amount);
          return sorted;
        },
        {
          name: 'Sort 10K rows',
          threshold: 100,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });

    it('should sort 100K rows in under 500ms', async () => {
      const data = generateTestData(100000);

      const result = await runBenchmark(
        () => {
          const sorted = [...data].sort((a, b) => b.amount - a.amount);
          return sorted;
        },
        {
          name: 'Sort 100K rows',
          threshold: 500,
        }
      );

      assertBenchmark(result);
      console.log(formatBenchmarkResult(result));
    });
  });
});
