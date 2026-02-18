/**
 * Benchmark Helpers Tests
 * Tests for benchmark utilities
 */

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from 'vitest';
import {
  measureExecutionTime,
  runBenchmark,
  measureFrameRate,
  generateTestData,
  formatBenchmarkResult,
  assertBenchmark,
  measureLoadTime,
  type BenchmarkResult,
} from './benchmarkHelpers';

describe('benchmarkHelpers', () => {
  describe('measureExecutionTime', () => {
    it('should measure synchronous function execution time', async () => {
      const syncFn = () => {
        return 42;
      };

      const { result, duration } = await measureExecutionTime(syncFn);

      expect(result).toBe(42);
      expect(duration).toBeGreaterThanOrEqual(0);
      expect(duration).toBeLessThan(100); // Should be very fast
    });

    it('should measure asynchronous function execution time', async () => {
      const asyncFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'async-result';
      };

      const { result, duration } = await measureExecutionTime(asyncFn);

      expect(result).toBe('async-result');
      expect(duration).toBeGreaterThan(0); // Just verify it was measured
      expect(duration).toBeLessThan(50); // Should be close to 10ms
    });

    it('should handle functions that throw errors', async () => {
      const errorFn = () => {
        throw new Error('Test error');
      };

      await expect(measureExecutionTime(errorFn)).rejects.toThrow('Test error');
    });
  });

  describe('runBenchmark', () => {
    it('should run single iteration benchmark', async () => {
      const fastFn = () => 'result';

      const result = await runBenchmark(fastFn, {
        name: 'Fast Operation',
        threshold: 100,
      });

      expect(result.name).toBe('Fast Operation');
      expect(result.threshold).toBe(100);
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.passed).toBe(true);
      expect(result.unit).toBe('ms');
    });

    it('should run multiple iterations and calculate average', async () => {
      const fn = () => 'result';

      const result = await runBenchmark(fn, {
        name: 'Multi-iteration Test',
        threshold: 100,
        iterations: 5,
      });

      expect(result.name).toBe('Multi-iteration Test');
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.passed).toBe(true);
    });

    it('should run warmup iterations before measurement', async () => {
      const fn = () => 'result';

      const result = await runBenchmark(fn, {
        name: 'With Warmup',
        threshold: 100,
        iterations: 3,
        warmupRuns: 2,
      });

      expect(result.name).toBe('With Warmup');
      expect(result.passed).toBe(true);
    });

    it('should fail when threshold is exceeded', async () => {
      const slowFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        return 'slow';
      };

      const result = await runBenchmark(slowFn, {
        name: 'Slow Operation',
        threshold: 10, // Very low threshold
      });

      expect(result.passed).toBe(false);
      expect(result.duration).toBeGreaterThan(10);
    });
  });

  describe('measureFrameRate', () => {
    beforeEach(() => {
      vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
        return window.setTimeout(() => cb(performance.now()), 16) as unknown as number;
      });
      vi.stubGlobal('cancelAnimationFrame', (id: number) => {
        window.clearTimeout(id);
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should measure frame rate for animation', async () => {
      let frameCount = 0;
      const callback = () => {
        frameCount++;
        return frameCount < 10; // Stop after 10 frames
      };

      const metrics = await measureFrameRate(callback, 500);

      expect(metrics.totalFrames).toBeGreaterThan(0);
      expect(metrics.averageFPS).toBeGreaterThan(0);
      expect(metrics.minFPS).toBeGreaterThan(0);
      expect(metrics.maxFPS).toBeGreaterThan(0);
      expect(metrics.duration).toBeGreaterThan(0);
    });

    it('should handle single frame scenario', async () => {
      const callback = () => false; // Stop immediately

      const metrics = await measureFrameRate(callback, 100);

      expect(metrics.totalFrames).toBe(1);
      expect(metrics.averageFPS).toBe(0);
    });
  });

  describe('generateTestData', () => {
    it('should generate specified number of test records', () => {
      const data = generateTestData(100);

      expect(data).toHaveLength(100);
    });

    it('should generate 1K records efficiently', () => {
      const data = generateTestData(1000);

      expect(data).toHaveLength(1000);
      expect(data[0]).toHaveProperty('donorName');
      expect(data[0]).toHaveProperty('amount');
      expect(data[0]).toHaveProperty('date');
      expect(data[0]).toHaveProperty('category');
    });

    it('should generate 10K records efficiently', () => {
      const data = generateTestData(10000);

      expect(data).toHaveLength(10000);
      expect(data[9999]).toHaveProperty('donorName');
    });

    it('should generate 100K records efficiently', () => {
      const data = generateTestData(100000);

      expect(data).toHaveLength(100000);
      expect(data[99999]).toHaveProperty('donorName');
    });

    it('should generate unique donor names', () => {
      const data = generateTestData(100);

      const names = new Set(data.map((d) => d.donorName));
      expect(names.size).toBe(100);
    });

    it('should have valid amounts between 0 and 1000', () => {
      const data = generateTestData(1000);

      data.forEach((record) => {
        expect(record.amount).toBeGreaterThanOrEqual(0);
        expect(record.amount).toBeLessThan(1000);
      });
    });

    it('should have valid dates', () => {
      const data = generateTestData(100);

      data.forEach((record) => {
        expect(record.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });
  });

  describe('formatBenchmarkResult', () => {
    it('should format passing benchmark result', () => {
      const result: BenchmarkResult = {
        name: 'Test Benchmark',
        duration: 50,
        passed: true,
        threshold: 100,
        unit: 'ms',
      };

      const formatted = formatBenchmarkResult(result);

      expect(formatted).toContain('✓ PASS');
      expect(formatted).toContain('Test Benchmark');
      expect(formatted).toContain('50.00ms');
      expect(formatted).toContain('100ms threshold');
    });

    it('should format failing benchmark result', () => {
      const result: BenchmarkResult = {
        name: 'Failing Benchmark',
        duration: 150,
        passed: false,
        threshold: 100,
        unit: 'ms',
      };

      const formatted = formatBenchmarkResult(result);

      expect(formatted).toContain('✗ FAIL');
      expect(formatted).toContain('Failing Benchmark');
      expect(formatted).toContain('150.00ms');
    });

    it('should calculate percentage of threshold', () => {
      const result: BenchmarkResult = {
        name: 'Test',
        duration: 75,
        passed: true,
        threshold: 100,
        unit: 'ms',
      };

      const formatted = formatBenchmarkResult(result);

      expect(formatted).toContain('75.0%');
    });
  });

  describe('assertBenchmark', () => {
    it('should not throw when benchmark passes', () => {
      const result: BenchmarkResult = {
        name: 'Passing Benchmark',
        duration: 50,
        passed: true,
        threshold: 100,
        unit: 'ms',
      };

      expect(() => assertBenchmark(result)).not.toThrow();
    });

    it('should throw when benchmark fails', () => {
      const result: BenchmarkResult = {
        name: 'Failing Benchmark',
        duration: 150,
        passed: false,
        threshold: 100,
        unit: 'ms',
      };

      expect(() => assertBenchmark(result)).toThrow(
        'Performance threshold exceeded'
      );
    });

    it('should include duration and threshold in error message', () => {
      const result: BenchmarkResult = {
        name: 'Slow Benchmark',
        duration: 250.5,
        passed: false,
        threshold: 100,
        unit: 'ms',
      };

      expect(() => assertBenchmark(result)).toThrow('250.50ms');
      expect(() => assertBenchmark(result)).toThrow('100ms');
    });
  });

  describe('measureLoadTime', () => {
    it('should measure async loader time', async () => {
      const loader = async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return { data: 'loaded' };
      };

      const result = await measureLoadTime(loader);

      expect(result.name).toBe('Initial Load Time');
      expect(result.threshold).toBe(3000);
      expect(result.duration).toBeGreaterThan(0); // Just verify it was measured
      expect(result.passed).toBe(true);
    });

    it('should pass when load time is under 3 seconds', async () => {
      const fastLoader = async () => {
        return { data: 'fast' };
      };

      const result = await measureLoadTime(fastLoader);

      expect(result.passed).toBe(true);
    });

    it('should fail when load time exceeds 3 seconds', async () => {
      const slowLoader = async () => {
        await new Promise((resolve) => setTimeout(resolve, 3100));
        return { data: 'slow' };
      };

      const result = await measureLoadTime(slowLoader);

      expect(result.passed).toBe(false);
      expect(result.duration).toBeGreaterThan(3000);
    });
  });
});
