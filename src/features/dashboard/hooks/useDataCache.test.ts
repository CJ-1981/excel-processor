/**
 * Specification tests for useDataCache hook
 *
 * TDD RED-GREEN-REFACTOR cycle for TASK-009
 * Custom React hook that caches expensive data processing results
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useDataCache } from './useDataCache';

describe('useDataCache', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Basic Cache Functionality', () => {
    it('should initialize with empty cache', () => {
      const { result } = renderHook(() =>
        useDataCache<{ key: string }>({ maxSize: 10 })
      );

      expect(result.current.getStats().cacheSize).toBe(0);
      expect(result.current.getStats().hitRate).toBe(0);
    });

    it('should store and retrieve cached values by key', () => {
      const { result } = renderHook(() =>
        useDataCache<{ value: number }>({ maxSize: 10 })
      );

      const testData = { value: 42 };
      const cacheKey = 'test-key';

      act(() => {
        result.current.set(cacheKey, testData);
      });

      const cached = result.current.get(cacheKey);
      expect(cached).toEqual(testData);
    });

    it('should return undefined for non-existent keys', () => {
      const { result } = renderHook(() =>
        useDataCache<{ value: number }>({ maxSize: 10 })
      );

      const cached = result.current.get('non-existent-key');
      expect(cached).toBeUndefined();
    });

    it('should update existing cache entry', () => {
      const { result } = renderHook(() =>
        useDataCache<{ value: number }>({ maxSize: 10 })
      );

      const cacheKey = 'test-key';

      act(() => {
        result.current.set(cacheKey, { value: 1 });
        result.current.set(cacheKey, { value: 2 });
      });

      const cached = result.current.get(cacheKey);
      expect(cached).toEqual({ value: 2 });
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate consistent hash keys for same input data', () => {
      const { result } = renderHook(() =>
        useDataCache<{ value: number }>({ maxSize: 10 })
      );

      const testData = { value: 42 };
      const key1 = result.current.generateKey(testData);
      const key2 = result.current.generateKey(testData);

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different input data', () => {
      const { result } = renderHook(() =>
        useDataCache<{ value: number }>({ maxSize: 10 })
      );

      const key1 = result.current.generateKey({ value: 1 });
      const key2 = result.current.generateKey({ value: 2 });

      expect(key1).not.toBe(key2);
    });

    it('should generate keys based on object structure', () => {
      const { result } = renderHook(() =>
        useDataCache<{ a: number; b: string }>({ maxSize: 10 })
      );

      const key1 = result.current.generateKey({ a: 1, b: 'test' });
      const key2 = result.current.generateKey({ b: 'test', a: 1 }); // Different order

      // Same data should generate same key regardless of property order
      expect(key1).toBe(key2);
    });

    it('should handle array inputs for key generation', () => {
      const { result } = renderHook(() =>
        useDataCache<number[]>({ maxSize: 10 })
      );

      const key1 = result.current.generateKey([1, 2, 3]);
      const key2 = result.current.generateKey([1, 2, 3]);

      expect(key1).toBe(key2);
    });

    it('should handle nested objects for key generation', () => {
      const { result } = renderHook(() =>
        useDataCache<{ nested: { value: number } }>({ maxSize: 10 })
      );

      const key1 = result.current.generateKey({ nested: { value: 42 } });
      const key2 = result.current.generateKey({ nested: { value: 42 } });

      expect(key1).toBe(key2);
    });
  });

  describe('LRU Eviction Policy', () => {
    it('should evict least recently used entry when cache is full', () => {
      const maxSize = 3;
      const { result } = renderHook(() =>
        useDataCache<number>({ maxSize })
      );

      act(() => {
        result.current.set('key1', 1);
        result.current.set('key2', 2);
        result.current.set('key3', 3);
        // Cache is now full
        result.current.set('key4', 4); // Should evict key1 (least recently used)
      });

      expect(result.current.get('key1')).toBeUndefined(); // Evicted
      expect(result.current.get('key2')).toBe(2);
      expect(result.current.get('key3')).toBe(3);
      expect(result.current.get('key4')).toBe(4);
    });

    it('should update LRU order on cache access', () => {
      const maxSize = 3;
      const { result } = renderHook(() =>
        useDataCache<number>({ maxSize })
      );

      act(() => {
        result.current.set('key1', 1);
        result.current.set('key2', 2);
        result.current.set('key3', 3);
        result.current.get('key1'); // Access key1 to make it recently used
        result.current.set('key4', 4); // Should evict key2 (now least recently used)
      });

      expect(result.current.get('key1')).toBe(1); // Still in cache
      expect(result.current.get('key2')).toBeUndefined(); // Evicted
      expect(result.current.get('key3')).toBe(3);
      expect(result.current.get('key4')).toBe(4);
    });

    it('should update LRU order on cache update', () => {
      const maxSize = 3;
      const { result } = renderHook(() =>
        useDataCache<number>({ maxSize })
      );

      act(() => {
        result.current.set('key1', 1);
        result.current.set('key2', 2);
        result.current.set('key3', 3);
        result.current.set('key1', 10); // Update key1 to make it recently used
        result.current.set('key4', 4); // Should evict key2 (now least recently used)
      });

      expect(result.current.get('key1')).toBe(10); // Updated and still in cache
      expect(result.current.get('key2')).toBeUndefined(); // Evicted
      expect(result.current.get('key3')).toBe(3);
      expect(result.current.get('key4')).toBe(4);
    });

    it('should respect maxSize configuration', () => {
      const maxSize = 5;
      const { result } = renderHook(() =>
        useDataCache<number>({ maxSize })
      );

      act(() => {
        for (let i = 1; i <= 10; i++) {
          result.current.set(`key${i}`, i);
        }
      });

      // Only maxSize entries should remain
      expect(result.current.getStats().cacheSize).toBe(maxSize);
      expect(result.current.get('key1')).toBeUndefined();
      expect(result.current.get('key10')).toBe(10);
    });

    it('should use default maxSize of 10 when not specified', () => {
      const { result } = renderHook(() => useDataCache<number>());

      act(() => {
        for (let i = 1; i <= 15; i++) {
          result.current.set(`key${i}`, i);
        }
      });

      expect(result.current.getStats().cacheSize).toBe(10);
      expect(result.current.get('key1')).toBeUndefined();
      expect(result.current.get('key15')).toBe(15);
    });
  });

  describe('Cache Hit Rate Tracking', () => {
    it('should track cache hits', () => {
      const { result } = renderHook(() =>
        useDataCache<number>({ maxSize: 10 })
      );

      act(() => {
        result.current.set('key1', 1);
        result.current.get('key1'); // Hit
        result.current.get('key1'); // Hit
      });

      const stats = result.current.getStats();
      expect(stats.hits).toBe(2);
    });

    it('should track cache misses', () => {
      const { result } = renderHook(() =>
        useDataCache<number>({ maxSize: 10 })
      );

      act(() => {
        result.current.get('non-existent'); // Miss
        result.current.get('another-miss'); // Miss
      });

      const stats = result.current.getStats();
      expect(stats.misses).toBe(2);
    });

    it('should calculate hit rate correctly', () => {
      const { result } = renderHook(() =>
        useDataCache<number>({ maxSize: 10 })
      );

      act(() => {
        result.current.set('key1', 1);
        result.current.get('key1'); // Hit
        result.current.get('key1'); // Hit
        result.current.get('key2'); // Miss
      });

      const stats = result.current.getStats();
      expect(stats.hitRate).toBe(2 / 3); // 2 hits out of 3 total accesses
    });

    it('should handle hit rate calculation with zero accesses', () => {
      const { result } = renderHook(() =>
        useDataCache<number>({ maxSize: 10 })
      );

      const stats = result.current.getStats();
      expect(stats.hitRate).toBe(0);
    });

    it('should track total accesses', () => {
      const { result } = renderHook(() =>
        useDataCache<number>({ maxSize: 10 })
      );

      act(() => {
        result.current.set('key1', 1);
        result.current.get('key1'); // Hit
        result.current.get('key2'); // Miss
        result.current.get('key1'); // Hit
      });

      const stats = result.current.getStats();
      expect(stats.totalAccesses).toBe(3);
    });

    it('should expose hit rate percentage', () => {
      const { result } = renderHook(() =>
        useDataCache<number>({ maxSize: 10 })
      );

      act(() => {
        result.current.set('key1', 1);
        result.current.set('key2', 2);
        result.current.get('key1'); // Hit
        result.current.get('key2'); // Hit
        result.current.get('key3'); // Miss
        result.current.get('key1'); // Hit
      });

      const stats = result.current.getStats();
      expect(stats.hitRatePercentage).toBe(75); // 75%
    });
  });

  describe('Thread Safety', () => {
    it('should handle rapid concurrent sets', () => {
      const { result } = renderHook(() =>
        useDataCache<number>({ maxSize: 10 })
      );

      act(() => {
        // Simulate rapid concurrent operations
        for (let i = 0; i < 100; i++) {
          result.current.set(`key${i}`, i);
        }
      });

      const stats = result.current.getStats();
      expect(stats.cacheSize).toBe(10); // Should not exceed maxSize
    });

    it('should handle rapid concurrent gets', () => {
      const { result } = renderHook(() =>
        useDataCache<number>({ maxSize: 10 })
      );

      act(() => {
        result.current.set('key1', 1);
        result.current.set('key2', 2);

        // Simulate rapid concurrent reads
        for (let i = 0; i < 100; i++) {
          result.current.get('key1');
          result.current.get('key2');
          result.current.get('non-existent');
        }
      });

      const stats = result.current.getStats();
      expect(stats.hits).toBe(200); // 100 reads for key1 + 100 reads for key2
      expect(stats.misses).toBe(100); // 100 misses for non-existent
    });

    it('should maintain cache consistency under concurrent operations', () => {
      const { result } = renderHook(() =>
        useDataCache<number>({ maxSize: 5 })
      );

      act(() => {
        // Mix of concurrent reads and writes
        for (let i = 0; i < 50; i++) {
          result.current.set(`key${i % 10}`, i);
          result.current.get(`key${i % 5}`);
        }
      });

      const stats = result.current.getStats();
      expect(stats.cacheSize).toBeLessThanOrEqual(5);
    });
  });

  describe('Cache Management', () => {
    it('should clear all cache entries', () => {
      const { result } = renderHook(() =>
        useDataCache<number>({ maxSize: 10 })
      );

      act(() => {
        result.current.set('key1', 1);
        result.current.set('key2', 2);
        result.current.set('key3', 3);
        result.current.clear();
      });

      const stats = result.current.getStats();
      expect(stats.cacheSize).toBe(0);
      expect(result.current.get('key1')).toBeUndefined();
      expect(result.current.get('key2')).toBeUndefined();
      expect(result.current.get('key3')).toBeUndefined();
    });

    it('should reset hit rate statistics on clear', () => {
      const { result } = renderHook(() =>
        useDataCache<number>({ maxSize: 10 })
      );

      act(() => {
        result.current.set('key1', 1);
        result.current.get('key1'); // Hit
        result.current.get('key2'); // Miss
        result.current.clear();
      });

      const stats = result.current.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.totalAccesses).toBe(0);
      expect(stats.hitRate).toBe(0);
    });

    it('should check if key exists in cache', () => {
      const { result } = renderHook(() =>
        useDataCache<number>({ maxSize: 10 })
      );

      act(() => {
        result.current.set('key1', 1);
      });

      expect(result.current.has('key1')).toBe(true);
      expect(result.current.has('key2')).toBe(false);
    });

    it('should delete specific cache entry', () => {
      const { result } = renderHook(() =>
        useDataCache<number>({ maxSize: 10 })
      );

      act(() => {
        result.current.set('key1', 1);
        result.current.set('key2', 2);
        result.current.delete('key1');
      });

      expect(result.current.has('key1')).toBe(false);
      expect(result.current.has('key2')).toBe(true);
    });

    it('should return current cache size', () => {
      const { result } = renderHook(() =>
        useDataCache<number>({ maxSize: 10 })
      );

      expect(result.current.getStats().cacheSize).toBe(0);

      act(() => {
        result.current.set('key1', 1);
        result.current.set('key2', 2);
        result.current.set('key3', 3);
      });

      expect(result.current.getStats().cacheSize).toBe(3);
    });
  });

  describe('Complex Data Types', () => {
    it('should cache complex nested objects', () => {
      type ComplexData = {
        user: {
          name: string;
          age: number;
          address: {
            street: string;
            city: string;
          };
        };
        tags: string[];
      };

      const { result } = renderHook(() =>
        useDataCache<ComplexData>({ maxSize: 10 })
      );

      const complexData: ComplexData = {
        user: {
          name: 'John Doe',
          age: 30,
          address: {
            street: '123 Main St',
            city: 'New York',
          },
        },
        tags: ['tag1', 'tag2', 'tag3'],
      };

      act(() => {
        result.current.set('complex', complexData);
      });

      const cached = result.current.get('complex');
      expect(cached).toEqual(complexData);
    });

    it('should cache arrays of objects', () => {
      type Item = { id: number; name: string };

      const { result } = renderHook(() =>
        useDataCache<Item[]>({ maxSize: 10 })
      );

      const arrayOfItems: Item[] = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
      ];

      act(() => {
        result.current.set('items', arrayOfItems);
      });

      const cached = result.current.get('items');
      expect(cached).toEqual(arrayOfItems);
    });
  });

  describe('Configuration', () => {
    it('should accept custom maxSize configuration', () => {
      const { result } = renderHook(() =>
        useDataCache<number>({ maxSize: 20 })
      );

      act(() => {
        for (let i = 1; i <= 25; i++) {
          result.current.set(`key${i}`, i);
        }
      });

      expect(result.current.getStats().cacheSize).toBe(20);
    });

    it('should handle maxSize of 1', () => {
      const { result } = renderHook(() =>
        useDataCache<number>({ maxSize: 1 })
      );

      act(() => {
        result.current.set('key1', 1);
        result.current.set('key2', 2);
      });

      expect(result.current.getStats().cacheSize).toBe(1);
      expect(result.current.get('key1')).toBeUndefined();
      expect(result.current.get('key2')).toBe(2);
    });

    it('should handle very large maxSize', () => {
      const { result } = renderHook(() =>
        useDataCache<number>({ maxSize: 1000 })
      );

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.set(`key${i}`, i);
        }
      });

      expect(result.current.getStats().cacheSize).toBe(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string keys', () => {
      const { result } = renderHook(() =>
        useDataCache<number>({ maxSize: 10 })
      );

      act(() => {
        result.current.set('', 42);
      });

      expect(result.current.get('')).toBe(42);
    });

    it('should handle special characters in keys', () => {
      const { result } = renderHook(() =>
        useDataCache<number>({ maxSize: 10 })
      );

      const specialKey = 'key-with-special.chars!@#$%';

      act(() => {
        result.current.set(specialKey, 42);
      });

      expect(result.current.get(specialKey)).toBe(42);
    });

    it('should handle null and undefined values', () => {
      const { result } = renderHook(() =>
        useDataCache<string | null | undefined>({ maxSize: 10 })
      );

      act(() => {
        result.current.set('null-key', null);
        result.current.set('undefined-key', undefined);
      });

      expect(result.current.get('null-key')).toBeNull();
      expect(result.current.get('undefined-key')).toBeUndefined();
    });

    it('should handle updating value to null', () => {
      const { result } = renderHook(() =>
        useDataCache<string | null>({ maxSize: 10 })
      );

      act(() => {
        result.current.set('key1', 'value');
        result.current.set('key1', null);
      });

      expect(result.current.get('key1')).toBeNull();
    });
  });
});
