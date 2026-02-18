/**
 * Chart Data Processing Benchmark Tests
 * Measures data processing time for chart transformations (target: <500ms for 100K rows)
 */

import { describe, it, expect } from 'vitest';
import { runBenchmark, generateTestData, type TestRow } from '../utils/benchmarkHelpers';

describe('Performance: Chart Data Processing', () => {
  describe('TrendChart Data Transformation', () => {
    it('should transform 1K rows for trend chart in under 20ms', async () => {
      const data = generateTestData(1000);

      const result = await runBenchmark(
        () => {
          const transformed = data.map((d, i) => ({
            period: `Week ${i + 1}`,
            amount: d.amount,
            date: new Date(d.date),
          }));
          return transformed;
        },
        {
          name: 'TrendChart 1K transform',
          threshold: 20,
        }
      );

      expect(result.passed).toBe(true);
      console.log(`[BENCHMARK] TrendChart 1K transform: ${result.duration.toFixed(2)}ms`);
    });

    it('should transform 10K rows for trend chart in under 100ms', async () => {
      const data = generateTestData(10000);

      const result = await runBenchmark(
        () => {
          const transformed = data.map((d, i) => ({
            period: `Day ${i + 1}`,
            amount: d.amount,
            date: new Date(d.date),
          }));
          return transformed;
        },
        {
          name: 'TrendChart 10K transform',
          threshold: 100,
        }
      );

      expect(result.passed).toBe(true);
      console.log(`[BENCHMARK] TrendChart 10K transform: ${result.duration.toFixed(2)}ms`);
    });

    it('should transform 100K rows for trend chart in under 500ms', async () => {
      const data = generateTestData(100000);

      const result = await runBenchmark(
        () => {
          const transformed = data.map((d, i) => ({
            period: `Day ${i + 1}`,
            amount: d.amount,
            date: new Date(d.date),
          }));
          return transformed;
        },
        {
          name: 'TrendChart 100K transform',
          threshold: 500,
        }
      );

      expect(result.passed).toBe(true);
      console.log(`[BENCHMARK] TrendChart 100K transform: ${result.duration.toFixed(2)}ms`);
    });
  });

  describe('TopDonorsChart Data Aggregation', () => {
    it('should aggregate 1K rows for top donors in under 30ms', async () => {
      const data = generateTestData(1000);

      const result = await runBenchmark(
        () => {
          const aggregated = data.reduce((acc: Record<string, number>, d: TestRow) => {
            const name = d.donorName;
            acc[name] = (acc[name] || 0) + d.amount;
            return acc;
          }, {});

          const sorted = Object.entries(aggregated)
            .map(([category, value]) => ({ category, value, count: 1, percentage: 0 }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

          return sorted;
        },
        {
          name: 'TopDonorsChart 1K aggregate',
          threshold: 30,
        }
      );

      expect(result.passed).toBe(true);
      console.log(`[BENCHMARK] TopDonorsChart 1K aggregate: ${result.duration.toFixed(2)}ms`);
    });

    it('should aggregate 10K rows for top donors in under 150ms', async () => {
      const data = generateTestData(10000);

      const result = await runBenchmark(
        () => {
          const aggregated = data.reduce((acc: Record<string, number>, d: TestRow) => {
            const name = d.donorName;
            acc[name] = (acc[name] || 0) + d.amount;
            return acc;
          }, {});

          const sorted = Object.entries(aggregated)
            .map(([category, value]) => ({ category, value, count: 1, percentage: 0 }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

          return sorted;
        },
        {
          name: 'TopDonorsChart 10K aggregate',
          threshold: 150,
        }
      );

      expect(result.passed).toBe(true);
      console.log(`[BENCHMARK] TopDonorsChart 10K aggregate: ${result.duration.toFixed(2)}ms`);
    });

    it('should aggregate 100K rows for top donors in under 500ms', async () => {
      const data = generateTestData(100000);

      const result = await runBenchmark(
        () => {
          const aggregated = data.reduce((acc: Record<string, number>, d: TestRow) => {
            const name = d.donorName;
            acc[name] = (acc[name] || 0) + d.amount;
            return acc;
          }, {});

          const sorted = Object.entries(aggregated)
            .map(([category, value]) => ({ category, value, count: 1, percentage: 0 }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

          return sorted;
        },
        {
          name: 'TopDonorsChart 100K aggregate',
          threshold: 500,
        }
      );

      expect(result.passed).toBe(true);
      console.log(`[BENCHMARK] TopDonorsChart 100K aggregate: ${result.duration.toFixed(2)}ms`);
    });
  });

  describe('DistributionHistogram Data Binning', () => {
    const createHistogramData = (values: number[]) => {
      const min = Math.min(...values);
      const max = Math.max(...values);
      const binCount = 10;
      const binSize = (max - min) / binCount;

      const bins = Array.from({ length: binCount }, (_, i) => {
        const binStart = min + i * binSize;
        const binEnd = binStart + binSize;
        const count = values.filter(v => v >= binStart && v < binEnd).length;
        return {
          binStart,
          binEnd,
          count,
          label: `${Math.floor(binStart)}-${Math.floor(binEnd)}`,
        };
      });

      return {
        bins,
        mean: values.reduce((a, b) => a + b, 0) / values.length,
        median: values.sort((a, b) => a - b)[Math.floor(values.length / 2)],
        min,
        max,
      };
    };

    it('should create histogram from 1K rows in under 30ms', async () => {
      const data = generateTestData(1000);
      const values = data.map((d) => d.amount);

      const result = await runBenchmark(
        () => createHistogramData(values),
        {
          name: 'Histogram 1K binning',
          threshold: 30,
        }
      );

      expect(result.passed).toBe(true);
      console.log(`[BENCHMARK] Histogram 1K binning: ${result.duration.toFixed(2)}ms`);
    });

    it('should create histogram from 10K rows in under 150ms', async () => {
      const data = generateTestData(10000);
      const values = data.map((d) => d.amount);

      const result = await runBenchmark(
        () => createHistogramData(values),
        {
          name: 'Histogram 10K binning',
          threshold: 150,
        }
      );

      expect(result.passed).toBe(true);
      console.log(`[BENCHMARK] Histogram 10K binning: ${result.duration.toFixed(2)}ms`);
    });

    it('should create histogram from 100K rows in under 500ms', async () => {
      const data = generateTestData(100000);
      const values = data.map((d) => d.amount);

      const result = await runBenchmark(
        () => createHistogramData(values),
        {
          name: 'Histogram 100K binning',
          threshold: 500,
        }
      );

      expect(result.passed).toBe(true);
      console.log(`[BENCHMARK] Histogram 100K binning: ${result.duration.toFixed(2)}ms`);
    });
  });
});
