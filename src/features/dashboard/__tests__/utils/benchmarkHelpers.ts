/**
 * Benchmark Helper Utilities
 * Provides utilities for measuring performance metrics in dashboard components
 */

export interface BenchmarkResult {
  name: string;
  duration: number; // milliseconds
  passed: boolean;
  threshold: number;
  unit: string;
}

export interface BenchmarkOptions {
  name: string;
  threshold: number; // maximum acceptable duration in ms
  iterations?: number; // number of iterations for average (default: 1)
  warmupRuns?: number; // number of warmup runs before measurement (default: 0)
}

export interface FrameRateMetrics {
  averageFPS: number;
  minFPS: number;
  maxFPS: number;
  totalFrames: number;
  duration: number; // milliseconds
}

export interface TestRow extends Record<string, unknown> {
  _sourceFileName: string;
  _sourceSheetName: string;
  donorName: string;
  amount: number;
  date: string;
  category: string;
}

/**
 * Measure execution time of a function
 */
export async function measureExecutionTime<T>(
  fn: () => T | Promise<T>
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();
  return { result, duration: endTime - startTime };
}

/**
 * Run a benchmark with optional iterations and warmup
 */
export async function runBenchmark<T>(
  fn: () => T | Promise<T>,
  options: BenchmarkOptions
): Promise<BenchmarkResult> {
  const { name, threshold, iterations = 1, warmupRuns = 0 } = options;

  // Warmup runs (not measured)
  for (let i = 0; i < warmupRuns; i++) {
    await fn();
  }

  // Measured iterations
  const durations: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const { duration } = await measureExecutionTime(fn);
    durations.push(duration);
  }

  // Calculate average duration
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const passed = avgDuration <= threshold;

  return {
    name,
    duration: avgDuration,
    passed,
    threshold,
    unit: 'ms',
  };
}

/**
 * Measure frame rate during an animation or interaction
 */
export async function measureFrameRate(
  callback: (timestamp: number) => boolean,
  duration: number // measurement duration in ms
): Promise<FrameRateMetrics> {
  return new Promise((resolve) => {
    const startTime = performance.now();
    const frames: number[] = [];
    let animationId: number;

    function frame(timestamp: number) {
      const currentTime = performance.now();
      frames.push(timestamp);

      // Continue until callback returns false or duration exceeded
      const shouldContinue = callback(timestamp);
      const elapsed = currentTime - startTime;

      if (shouldContinue && elapsed < duration) {
        animationId = requestAnimationFrame(frame);
      } else {
        cancelAnimationFrame(animationId);
        resolve(calculateFrameRateMetrics(frames, elapsed));
      }
    }

    animationId = requestAnimationFrame(frame);
  });
}

/**
 * Calculate frame rate metrics from frame timestamps
 */
function calculateFrameRateMetrics(
  frames: number[],
  duration: number
): FrameRateMetrics {
  if (frames.length < 2) {
    return {
      averageFPS: 0,
      minFPS: 0,
      maxFPS: 0,
      totalFrames: frames.length,
      duration,
    };
  }

  // Calculate frame intervals in milliseconds
  const intervals: number[] = [];
  for (let i = 1; i < frames.length; i++) {
    intervals.push(frames[i] - frames[i - 1]);
  }

  // Convert intervals to FPS (1000ms / interval)
  const fpsValues = intervals.map((interval) => (1000 / interval));

  const averageFPS = fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length;
  const minFPS = Math.min(...fpsValues);
  const maxFPS = Math.max(...fpsValues);

  return {
    averageFPS,
    minFPS,
    maxFPS,
    totalFrames: frames.length,
    duration,
  };
}

/**
 * Generate test data of specified size
 */
export function generateTestData(size: number): TestRow[] {
  const data: TestRow[] = [];
  for (let i = 0; i < size; i++) {
    data.push({
      _sourceFileName: `test_${i}.csv`,
      _sourceSheetName: 'Sheet1',
      donorName: `Donor ${i}`,
      amount: Math.random() * 1000,
      date: new Date(2025, 0, (i % 28) + 1).toISOString().split('T')[0],
      category: i % 3 === 0 ? 'Monthly' : 'One-time',
    });
  }
  return data;
}

/**
 * Format benchmark result for test output
 */
export function formatBenchmarkResult(result: BenchmarkResult): string {
  const status = result.passed ? '✓ PASS' : '✗ FAIL';
  const percentage = (result.duration / result.threshold) * 100;
  return `${status} ${result.name}: ${result.duration.toFixed(2)}ms (${percentage.toFixed(1)}% of ${result.threshold}ms threshold)`;
}

/**
 * Assert that benchmark meets performance threshold
 */
export function assertBenchmark(result: BenchmarkResult): void {
  if (!result.passed) {
    throw new Error(
      `Performance threshold exceeded: ${result.name} took ${result.duration.toFixed(2)}ms, threshold is ${result.threshold}ms`
    );
  }
}

/**
 * Measure initial load time of a component
 */
export async function measureLoadTime<T>(
  loader: () => Promise<T>
): Promise<BenchmarkResult> {
  const { duration } = await measureExecutionTime(loader);
  return {
    name: 'Initial Load Time',
    duration,
    passed: duration < 3000, // 3 second threshold
    threshold: 3000,
    unit: 'ms',
  };
}
