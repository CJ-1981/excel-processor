/**
 * chunkLoadHandler.test.ts
 *
 * Tests for ChunkLoadError detection and retry handling utility.
 * Following TDD approach: tests written before implementation.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  isChunkLoadError,
  ChunkLoadRetryManager,
  type ChunkLoadRetryConfig,
  DEFAULT_RETRY_CONFIG,
} from './index';

describe('chunkLoadHandler - ChunkLoadError Detection and Retry Utility', () => {
  describe('isChunkLoadError', () => {
    it('should detect ChunkLoadError by error name', () => {
      const error = new Error('Loading chunk');
      error.name = 'ChunkLoadError';
      expect(isChunkLoadError(error)).toBe(true);
    });

    it('should detect chunk loading errors by message patterns', () => {
      const chunkLoadError = new Error('ChunkLoadError: Loading chunk 123 failed');
      expect(isChunkLoadError(chunkLoadError)).toBe(true);

      const loadingChunkError = new Error('Error: Loading chunk 2 failed');
      expect(isChunkLoadError(loadingChunkError)).toBe(true);

      const chunkLoadingError = new Error('chunk loading failed');
      expect(isChunkLoadError(chunkLoadingError)).toBe(true);
    });

    it('should return false for non-chunk errors', () => {
      const syntaxError = new Error('Unexpected token <');
      expect(isChunkLoadError(syntaxError)).toBe(false);

      const networkError = new Error('Network error');
      expect(isChunkLoadError(networkError)).toBe(false);

      const typeError = new TypeError('Cannot read property of undefined');
      expect(isChunkLoadError(typeError)).toBe(false);
    });

    it('should return false for null or undefined errors', () => {
      expect(isChunkLoadError(null)).toBe(false);
      expect(isChunkLoadError(undefined)).toBe(false);
    });

    it('should be case-insensitive for pattern matching', () => {
      const upperCaseError = new Error('CHUNKLOADERROR: FAILED');
      expect(isChunkLoadError(upperCaseError)).toBe(true);

      const mixedCaseError = new Error('Loading Chunk FAILED');
      expect(isChunkLoadError(mixedCaseError)).toBe(true);
    });

    it('should handle errors with minimal message', () => {
      const minimalError = new Error('chunk');
      expect(isChunkLoadError(minimalError)).toBe(false);

      const chunkError = new Error('chunkloaderror');
      expect(isChunkLoadError(chunkError)).toBe(true);
    });
  });

  describe('DEFAULT_RETRY_CONFIG', () => {
    it('should have default max retries of 3', () => {
      expect(DEFAULT_RETRY_CONFIG.maxRetries).toBe(3);
    });

    it('should have exponential backoff enabled', () => {
      expect(DEFAULT_RETRY_CONFIG.useExponentialBackoff).toBe(true);
    });

    it('should have base delay of 1000ms', () => {
      expect(DEFAULT_RETRY_CONFIG.baseDelayMs).toBe(1000);
    });

    it('should have backoff factor of 2', () => {
      expect(DEFAULT_RETRY_CONFIG.backoffFactor).toBe(2);
    });

    it('should have storage key prefix', () => {
      expect(DEFAULT_RETRY_CONFIG.storageKeyPrefix).toBe('chunk_retry_');
    });
  });

  describe('ChunkLoadRetryManager', () => {
    let manager: ChunkLoadRetryManager;
    let mockStorage: Map<string, string>;
    const storageKey = 'test_chunk_retry';

    beforeEach(() => {
      // Setup mock localStorage
      mockStorage = new Map();

      (globalThis as any).localStorage = {
        getItem: vi.fn((key) => mockStorage.get(key) || null),
        setItem: vi.fn((key, value) => mockStorage.set(key, value)),
        removeItem: vi.fn((key) => mockStorage.delete(key)),
        clear: vi.fn(() => mockStorage.clear()),
        get length() {
          return mockStorage.size;
        },
        key: vi.fn((index) => Array.from(mockStorage.keys())[index] || null),
      };

      manager = new ChunkLoadRetryManager({ storageKey });
    });

    afterEach(() => {
      mockStorage.clear();
      vi.clearAllMocks();
    });

    describe('constructor', () => {
      it('should initialize with default config', () => {
        const defaultManager = new ChunkLoadRetryManager();
        expect(defaultManager).toBeDefined();
        expect(defaultManager['config'].maxRetries).toBe(3);
      });

      it('should accept custom config', () => {
        const customConfig: ChunkLoadRetryConfig = {
          maxRetries: 5,
          useExponentialBackoff: false,
          baseDelayMs: 500,
        };
        const customManager = new ChunkLoadRetryManager(customConfig);
        expect(customManager['config'].maxRetries).toBe(5);
        expect(customManager['config'].useExponentialBackoff).toBe(false);
        expect(customManager['config'].baseDelayMs).toBe(500);
      });

      it('should use unique storage key if not provided', () => {
        const defaultManager = new ChunkLoadRetryManager();
        expect(defaultManager['config'].storageKey).toContain('chunk_retry_');
      });
    });

    describe('canRetry', () => {
      it('should return true for first retry attempt', () => {
        expect(manager.canRetry()).toBe(true);
      });

      it('should return true when retries below max limit', () => {
        manager.incrementRetry();
        expect(manager.canRetry()).toBe(true);

        manager.incrementRetry();
        expect(manager.canRetry()).toBe(true);
      });

      it('should return false when max retries reached', () => {
        manager.incrementRetry(); // 1
        manager.incrementRetry(); // 2
        manager.incrementRetry(); // 3 (max)

        expect(manager.canRetry()).toBe(false);
      });

      it('should persist retry count across instances', () => {
        const manager1 = new ChunkLoadRetryManager({ storageKey });
        manager1.incrementRetry();
        manager1.incrementRetry();

        const manager2 = new ChunkLoadRetryManager({ storageKey });
        expect(manager2.canRetry()).toBe(true); // 2 retries < 3 max

        manager2.incrementRetry(); // 3 retries
        expect(manager2.canRetry()).toBe(false);
      });
    });

    describe('getRetryCount', () => {
      it('should start at 0 for new chunk', () => {
        expect(manager.getRetryCount()).toBe(0);
      });

      it('should increment with each call to incrementRetry', () => {
        expect(manager.getRetryCount()).toBe(0);
        manager.incrementRetry();
        expect(manager.getRetryCount()).toBe(1);
        manager.incrementRetry();
        expect(manager.getRetryCount()).toBe(2);
      });

      it('should persist across instances', () => {
        const manager1 = new ChunkLoadRetryManager({ storageKey });
        manager1.incrementRetry();
        manager1.incrementRetry();

        const manager2 = new ChunkLoadRetryManager({ storageKey });
        expect(manager2.getRetryCount()).toBe(2);
      });

      it('should reset to 0 after reset', () => {
        manager.incrementRetry();
        manager.incrementRetry();
        expect(manager.getRetryCount()).toBe(2);

        manager.reset();
        expect(manager.getRetryCount()).toBe(0);
      });
    });

    describe('incrementRetry', () => {
      it('should increment retry count', () => {
        manager.incrementRetry();
        expect(manager.getRetryCount()).toBe(1);

        manager.incrementRetry();
        expect(manager.getRetryCount()).toBe(2);
      });

      it('should persist to localStorage', () => {
        manager.incrementRetry();

        expect(localStorage.setItem).toHaveBeenCalledWith(
          storageKey,
          expect.stringContaining('"retryCount":1')
        );
      });

      it('should update timestamp', () => {
        const beforeTimestamp = manager['getState']()?.lastRetryAt;
        expect(beforeTimestamp).toBeUndefined();

        manager.incrementRetry();

        const afterTimestamp = manager['getState']()?.lastRetryAt;
        expect(afterTimestamp).toBeDefined();
        expect(typeof afterTimestamp).toBe('number');
      });
    });

    describe('reset', () => {
      it('should reset retry count to 0', () => {
        manager.incrementRetry();
        manager.incrementRetry();
        expect(manager.getRetryCount()).toBe(2);

        manager.reset();
        expect(manager.getRetryCount()).toBe(0);
      });

      it('should remove state from localStorage', () => {
        manager.incrementRetry();
        expect(localStorage.getItem(storageKey)).toBeTruthy();

        manager.reset();
        expect(localStorage.getItem(storageKey)).toBeNull();
      });

      it('should allow retries after reset', () => {
        manager.incrementRetry();
        manager.incrementRetry();
        manager.incrementRetry();
        expect(manager.canRetry()).toBe(false);

        manager.reset();
        expect(manager.canRetry()).toBe(true);
      });
    });

    describe('getRetryDelay', () => {
      it('should return base delay for first retry', () => {
        expect(manager.getRetryDelay()).toBe(1000);
      });

      it('should apply exponential backoff when enabled', () => {
        manager.incrementRetry();
        expect(manager.getRetryDelay()).toBe(2000); // 1000 * 2^1

        manager.incrementRetry();
        expect(manager.getRetryDelay()).toBe(4000); // 1000 * 2^2
      });

      it('should return base delay when exponential backoff disabled', () => {
        const linearManager = new ChunkLoadRetryManager({
          storageKey: 'linear_test',
          useExponentialBackoff: false,
          baseDelayMs: 1500,
        });

        linearManager.incrementRetry();
        expect(linearManager.getRetryDelay()).toBe(1500);

        linearManager.incrementRetry();
        expect(linearManager.getRetryDelay()).toBe(1500);
      });

      it('should use custom base delay from config', () => {
        const customManager = new ChunkLoadRetryManager({
          storageKey: 'custom_delay',
          baseDelayMs: 2000,
        });

        expect(customManager.getRetryDelay()).toBe(2000);

        customManager.incrementRetry();
        expect(customManager.getRetryDelay()).toBe(4000); // 2000 * 2^1
      });

      it('should apply custom backoff factor', () => {
        const customManager = new ChunkLoadRetryManager({
          storageKey: 'custom_factor',
          baseDelayMs: 1000,
          backoffFactor: 3,
        });

        expect(customManager.getRetryDelay()).toBe(1000);

        customManager.incrementRetry();
        expect(customManager.getRetryDelay()).toBe(3000); // 1000 * 3^1

        customManager.incrementRetry();
        expect(customManager.getRetryDelay()).toBe(9000); // 1000 * 3^2
      });

      it('should cap maximum delay at 30 seconds', () => {
        const aggressiveManager = new ChunkLoadRetryManager({
          storageKey: 'aggressive',
          baseDelayMs: 10000,
          backoffFactor: 10,
        });

        aggressiveManager.incrementRetry();
        expect(aggressiveManager.getRetryDelay()).toBe(30000); // capped

        aggressiveManager.incrementRetry();
        expect(aggressiveManager.getRetryDelay()).toBe(30000); // capped
      });
    });

    describe('retry', () => {
      it('should execute callback when retries available', async () => {
        let callbackExecuted = false;
        const callback = vi.fn(() => {
          callbackExecuted = true;
          return Promise.resolve('success');
        });

        await manager.retry(callback);

        expect(callbackExecuted).toBe(true);
        expect(callback).toHaveBeenCalledTimes(1);
      });

      it('should throw error when max retries exceeded', async () => {
        const callback = vi.fn(() => Promise.resolve('success'));

        // Exhaust retries
        manager.incrementRetry();
        manager.incrementRetry();
        manager.incrementRetry();

        await expect(manager.retry(callback)).rejects.toThrow('Maximum retry attempts');
      });

      it('should increment retry count on failure', async () => {
        const chunkError = new Error('ChunkLoadError: Failed');
        chunkError.name = 'ChunkLoadError';
        const callback = vi.fn(() => Promise.reject(chunkError));

        await expect(manager.retry(callback)).rejects.toThrow();
        expect(manager.getRetryCount()).toBe(1);
      });

      it('should reset retry count on success', async () => {
        const callback = vi.fn(() => Promise.resolve('success'));

        manager.incrementRetry();
        expect(manager.getRetryCount()).toBe(1);

        await manager.retry(callback);

        expect(manager.getRetryCount()).toBe(0);
      });

      it('should delay before retry when configured', async () => {
        const quickManager = new ChunkLoadRetryManager({
          storageKey: 'quick_test',
          baseDelayMs: 10,
          useExponentialBackoff: false,
        });

        let attemptCount = 0;
        const callback = vi.fn(() => {
          attemptCount++;
          if (attemptCount < 2) {
            const chunkError = new Error('Not yet');
            chunkError.name = 'ChunkLoadError';
            return Promise.reject(chunkError);
          }
          return Promise.resolve('success');
        });

        const startTime = Date.now();
        await quickManager.retry(callback, { delayBeforeRetry: true });
        const duration = Date.now() - startTime;

        expect(callback).toHaveBeenCalledTimes(2);
        expect(duration).toBeGreaterThanOrEqual(10); // At least one delay
      });

      it('should throw non-ChunkLoadError immediately without retry', async () => {
        const nonChunkError = new Error('Some other error');
        const callback = vi.fn(() => Promise.reject(nonChunkError));

        await expect(manager.retry(callback)).rejects.toThrow('Some other error');
        expect(callback).toHaveBeenCalledTimes(1);
        expect(manager.getRetryCount()).toBe(0);
      });

      it('should retry ChunkLoadError with exponential backoff', async () => {
        const quickManager = new ChunkLoadRetryManager({
          storageKey: 'backoff_test',
          baseDelayMs: 10,
          backoffFactor: 2,
        });

        const chunkError = new Error('ChunkLoadError: Failed');
        chunkError.name = 'ChunkLoadError';
        const callback = vi.fn(() => Promise.reject(chunkError));

        await expect(quickManager.retry(callback, { delayBeforeRetry: true })).rejects.toThrow();
        expect(callback).toHaveBeenCalledTimes(3); // maxRetries = 3
        expect(quickManager.getRetryCount()).toBe(3);
      });
    });

    describe('getState', () => {
      it('should return null for new chunk', () => {
        expect(manager['getState']()).toBeNull();
      });

      it('should return state with retry count and timestamp', () => {
        manager.incrementRetry();

        const state = manager['getState']();
        expect(state).toEqual({
          retryCount: 1,
          lastRetryAt: expect.any(Number),
        });
      });

      it('should load persisted state from localStorage', () => {
        const manager1 = new ChunkLoadRetryManager({ storageKey });
        manager1.incrementRetry();
        manager1.incrementRetry();

        const manager2 = new ChunkLoadRetryManager({ storageKey });
        const state = manager2['getState']();

        expect(state?.retryCount).toBe(2);
        expect(state?.lastRetryAt).toBeDefined();
      });
    });

    describe('Edge Cases', () => {
      it('should handle localStorage quota exceeded gracefully', () => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
          throw new Error('QuotaExceededError');
        });

        // Should not throw, just continue without persistence
        expect(() => manager.incrementRetry()).not.toThrow();
      });

      it('should handle corrupted localStorage data', () => {
        localStorage.setItem(storageKey, 'invalid json');

        // Should handle gracefully and start fresh
        expect(manager.getRetryCount()).toBe(0);
      });

      it('should handle localStorage access denied (private browsing)', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
          throw new Error('Access denied');
        });

        const privateManager = new ChunkLoadRetryManager({ storageKey: 'private_test' });
        expect(privateManager.getRetryCount()).toBe(0);
      });

      it('should handle very large retry counts from storage', () => {
        localStorage.setItem(storageKey, JSON.stringify({ retryCount: 999999, lastRetryAt: Date.now() }));

        const largeManager = new ChunkLoadRetryManager({ storageKey });
        expect(largeManager.canRetry()).toBe(false);
      });

      it('should handle missing timestamp in stored state', () => {
        localStorage.setItem(storageKey, JSON.stringify({ retryCount: 1 }));

        const noTimeManager = new ChunkLoadRetryManager({ storageKey });
        expect(noTimeManager.getRetryCount()).toBe(1);
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete retry lifecycle', async () => {
      const storageKey = 'lifecycle_test';
      const manager = new ChunkLoadRetryManager({ storageKey });

      // Initial state
      expect(manager.canRetry()).toBe(true);
      expect(manager.getRetryCount()).toBe(0);

      // First failure
      const chunkError = new Error('ChunkLoadError');
      chunkError.name = 'ChunkLoadError';
      const failingCallback = vi.fn().mockRejectedValue(chunkError);

      await expect(manager.retry(failingCallback)).rejects.toThrow();
      expect(manager.getRetryCount()).toBe(1);
      expect(manager.canRetry()).toBe(true);

      // Second failure
      await expect(manager.retry(failingCallback)).rejects.toThrow();
      expect(manager.getRetryCount()).toBe(2);
      expect(manager.canRetry()).toBe(true);

      // Success before max retries
      const successCallback = vi.fn().mockResolvedValue('success');
      const result = await manager.retry(successCallback);

      expect(result).toBe('success');
      expect(manager.getRetryCount()).toBe(0); // Reset on success
      expect(manager.canRetry()).toBe(true);
    });

    it('should maintain separate retry state for different chunks', () => {
      const managerA = new ChunkLoadRetryManager({ storageKey: 'chunk_A' });
      const managerB = new ChunkLoadRetryManager({ storageKey: 'chunk_B' });

      managerA.incrementRetry();
      managerA.incrementRetry();
      managerB.incrementRetry();

      expect(managerA.getRetryCount()).toBe(2);
      expect(managerB.getRetryCount()).toBe(1);
      expect(managerA.canRetry()).toBe(true); // 2 < 3
      expect(managerB.canRetry()).toBe(true); // 1 < 3

      managerA.incrementRetry();
      expect(managerA.canRetry()).toBe(false); // 3 >= 3
      expect(managerB.canRetry()).toBe(true); // Still 1 < 3
    });
  });
});
