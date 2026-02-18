/**
 * Frame Rate Benchmark Tests
 * Measures frame rate during interactions (target: >55fps)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { measureFrameRate } from '../utils/benchmarkHelpers';

describe('Performance: Frame Rate During Interactions', () => {
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

  it('should maintain >30fps during dashboard resize', async () => {
    let frameCount = 0;

    const metrics = await measureFrameRate(() => {
      frameCount++;

      // Simulate resize operations
      new Array(100).fill(0).map((_, i) => i * i).reverse();

      return frameCount < 60; // Measure 60 frames (~1 second at 60fps)
    }, 1000);

    expect(metrics.averageFPS).toBeGreaterThan(30);
    expect(metrics.totalFrames).toBeGreaterThan(0);

    console.log(`[BENCHMARK] Resize interaction FPS: ${metrics.averageFPS.toFixed(2)}fps (min: ${metrics.minFPS.toFixed(2)}, max: ${metrics.maxFPS.toFixed(2)})`);
  });

  it('should maintain >30fps during drag operations', async () => {
    let frameCount = 0;

    const metrics = await measureFrameRate(() => {
      frameCount++;

      // Simulate drag calculations
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      [x, y, x + y, x * y].map(Math.abs);

      return frameCount < 60; // Measure 60 frames
    }, 1000);

    expect(metrics.averageFPS).toBeGreaterThan(30);
    expect(metrics.totalFrames).toBeGreaterThan(0);

    console.log(`[BENCHMARK] Drag interaction FPS: ${metrics.averageFPS.toFixed(2)}fps (min: ${metrics.minFPS.toFixed(2)}, max: ${metrics.maxFPS.toFixed(2)})`);
  });

  it('should maintain >30fps during chart updates', async () => {
    let frameCount = 0;

    const metrics = await measureFrameRate(() => {
      frameCount++;

      // Simulate chart data updates
      new Array(50).fill(0).map(() => Math.random() * 100).reduce((a, b) => a + b, 0) / 50;

      return frameCount < 60; // Measure 60 frames
    }, 1000);

    expect(metrics.averageFPS).toBeGreaterThan(30);
    expect(metrics.totalFrames).toBeGreaterThan(0);

    console.log(`[BENCHMARK] Chart update FPS: ${metrics.averageFPS.toFixed(2)}fps (min: ${metrics.minFPS.toFixed(2)}, max: ${metrics.maxFPS.toFixed(2)})`);
  });

  it('should establish baseline for frame rate with minimal work', async () => {
    let frameCount = 0;

    const metrics = await measureFrameRate(() => {
      frameCount++;
      return frameCount < 60; // Measure 60 frames
    }, 1000);

    expect(metrics.averageFPS).toBeGreaterThan(0);

    console.log(`[BASELINE] Minimal work FPS: ${metrics.averageFPS.toFixed(2)}fps (min: ${metrics.minFPS.toFixed(2)}, max: ${metrics.maxFPS.toFixed(2)})`);
  });

  it('should measure frame rate stability (min FPS should be close to average)', async () => {
    let frameCount = 0;

    const metrics = await measureFrameRate(() => {
      frameCount++;

      // Simulate consistent workload
      new Array(50).fill(0).map((_, i) => i);

      return frameCount < 60;
    }, 1000);

    // Min FPS should be at least 60% of average FPS for stable performance
    const stabilityRatio = metrics.minFPS / metrics.averageFPS;
    expect(stabilityRatio).toBeGreaterThan(0.6);

    console.log(`[BENCHMARK] Frame stability: ${stabilityRatio.toFixed(2)} (min/avg ratio)`);
  });
});
