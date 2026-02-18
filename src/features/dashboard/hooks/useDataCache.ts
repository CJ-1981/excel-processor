/**
 * useDataCache Hook
 *
 * Custom React hook that implements an LRU (Least Recently Used) cache
 * for expensive data processing results. Provides cache key generation,
 * LRU eviction policy, and cache hit rate tracking.
 *
 * @see SPEC-PERF-DASHBOARD-002 REQ-PERF-006
 */

import { useRef, useCallback, useMemo } from 'react';

/**
 * Configuration options for the cache
 */
export interface UseDataCacheOptions {
  /**
   * Maximum number of entries to store in the cache
   * When this limit is exceeded, the least recently used entry is evicted
   * @default 10
   */
  maxSize?: number;
}

/**
 * Statistics about cache performance
 */
export interface CacheStats {
  /**
   * Current number of entries in the cache
   */
  cacheSize: number;

  /**
   * Number of cache hits
   */
  hits: number;

  /**
   * Number of cache misses
   */
  misses: number;

  /**
   * Total number of cache accesses (hits + misses)
   */
  totalAccesses: number;

  /**
   * Cache hit rate as a decimal (0-1)
   */
  hitRate: number;

  /**
   * Cache hit rate as a percentage (0-100)
   */
  hitRatePercentage: number;
}

/**
 * LRU Cache entry with metadata for tracking access order
 */
interface CacheEntry<T> {
  /**
   * The cached value
   */
  value: T;

  /**
   * Access order counter for LRU tracking (higher = more recent)
   */
  accessOrder: number;
}

/**
 * Internal cache state
 */
interface CacheState<T> {
  /**
   * Map of cache key to entry
   */
  entries: Map<string, CacheEntry<T>>;

  /**
   * Statistics tracking
   */
  stats: {
    hits: number;
    misses: number;
  };

  /**
   * Access counter for LRU tracking
   */
  accessCounter: number;
}

/**
 * Result object returned by useDataCache hook
 */
export interface UseDataCacheResult<T> {
  /**
   * Get a value from the cache by key
   * @param key - Cache key
   * @returns Cached value or undefined if not found
   */
  get: (key: string) => T | undefined;

  /**
   * Set a value in the cache by key
   * @param key - Cache key
   * @param value - Value to cache
   */
  set: (key: string, value: T) => void;

  /**
   * Check if a key exists in the cache
   * @param key - Cache key
   * @returns True if key exists in cache
   */
  has: (key: string) => boolean;

  /**
   * Delete a specific entry from the cache
   * @param key - Cache key to delete
   */
  delete: (key: string) => void;

  /**
   * Clear all entries from the cache
   */
  clear: () => void;

  /**
   * Generate a cache key from input data using hash function
   * @param data - Input data to generate key from
   * @returns Hash string suitable for use as cache key
   */
  generateKey: (data: unknown) => string;

  /**
   * Get current cache statistics
   * @returns Cache performance metrics
   */
  getStats: () => CacheStats;
}

/**
 * Simple hash function for generating cache keys from data
 * Uses JSON.stringify with sorting for stable keys
 *
 * @param data - Data to hash
 * @returns Hexadecimal hash string
 */
function generateHashKey(data: unknown): string {
  try {
    // Convert data to sorted JSON string for stable hashing
    const str = JSON.stringify(data, (_, value) => {
      // Handle objects by sorting keys
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return Object.keys(value)
          .sort()
          .reduce<Record<string, unknown>>((sorted, key) => {
            sorted[key] = (value as Record<string, unknown>)[key];
            return sorted;
          }, {});
      }
      return value;
    });

    // Simple hash algorithm
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(16);
  } catch {
    // Fallback for circular references or unstringifiable data
    return Date.now().toString(16) + Math.random().toString(16).slice(2);
  }
}

/**
 * Custom hook for caching data with LRU eviction policy
 *
 * @param options - Cache configuration options
 * @returns Cache control object with methods for managing cache
 *
 * @example
 * ```tsx
 * const cache = useDataCache<ProcessedData>({ maxSize: 20 });
 *
 * // Cache expensive computation result
 * const key = cache.generateKey(rawData);
 * let processed = cache.get(key);
 * if (!processed) {
 *   processed = expensiveProcessing(rawData);
 *   cache.set(key, processed);
 * }
 * ```
 */
export function useDataCache<T = unknown>(
  options: UseDataCacheOptions = {}
): UseDataCacheResult<T> {
  const { maxSize = 10 } = options;

  // Use ref to persist cache across renders without causing re-renders
  const cacheRef = useRef<CacheState<T>>({
    entries: new Map(),
    stats: { hits: 0, misses: 0 },
    accessCounter: 0,
  });

  /**
   * Update LRU order by moving accessed entry to most recent
   */
  const updateAccessOrder = useCallback((key: string) => {
    const entry = cacheRef.current.entries.get(key);
    if (entry != null) {
      cacheRef.current.accessCounter++;
      entry.accessOrder = cacheRef.current.accessCounter;
    }
  }, []);

  /**
   * Evict least recently used entry if cache is at capacity
   */
  const evictIfNecessary = useCallback(() => {
    const { entries } = cacheRef.current;

    if (entries.size >= maxSize) {
      // Find least recently used entry
      let lruKey: string | null = null;
      let lowestAccess = Infinity;

      for (const [key, entry] of entries.entries()) {
        if (entry.accessOrder < lowestAccess) {
          lowestAccess = entry.accessOrder;
          lruKey = key;
        }
      }

      // Evict LRU entry
      if (lruKey != null) {
        entries.delete(lruKey);
      }
    }
  }, [maxSize]);

  /**
   * Get a value from cache by key
   */
  const get = useCallback(
    (key: string): T | undefined => {
      const { entries, stats } = cacheRef.current;
      const entry = entries.get(key);

      if (entry != null) {
        // Cache hit
        stats.hits++;
        updateAccessOrder(key);
        return entry.value;
      } else {
        // Cache miss
        stats.misses++;
        return undefined;
      }
    },
    [updateAccessOrder]
  );

  /**
   * Set a value in cache by key
   */
  const set = useCallback(
    (key: string, value: T) => {
      const { entries } = cacheRef.current;

      // Evict if necessary before adding new entry
      evictIfNecessary();

      // Increment access counter and add/update entry
      cacheRef.current.accessCounter++;
      entries.set(key, {
        value,
        accessOrder: cacheRef.current.accessCounter,
      });
    },
    [evictIfNecessary]
  );

  /**
   * Check if key exists in cache
   */
  const has = useCallback(
    (key: string): boolean => {
      return cacheRef.current.entries.has(key);
    },
    []
  );

  /**
   * Delete specific entry from cache
   */
  const deleteEntry = useCallback((key: string) => {
    cacheRef.current.entries.delete(key);
  }, []);

  /**
   * Clear all cache entries and reset statistics
   */
  const clear = useCallback(() => {
    cacheRef.current.entries.clear();
    cacheRef.current.stats = { hits: 0, misses: 0 };
  }, []);

  /**
   * Generate cache key from input data
   */
  const generateKey = useCallback((data: unknown): string => {
    return generateHashKey(data);
  }, []);

  /**
   * Get current cache statistics
   */
  const getStats = useCallback((): CacheStats => {
    const { entries, stats } = cacheRef.current;
    const totalAccesses = stats.hits + stats.misses;
    const hitRate = totalAccesses > 0 ? stats.hits / totalAccesses : 0;

    return {
      cacheSize: entries.size,
      hits: stats.hits,
      misses: stats.misses,
      totalAccesses,
      hitRate,
      hitRatePercentage: Math.round(hitRate * 100),
    };
  }, []);

  // Return stable reference to cache control object
  return useMemo(
    () => ({
      get,
      set,
      has,
      delete: deleteEntry,
      clear,
      generateKey,
      getStats,
    }),
    [get, set, has, deleteEntry, clear, generateKey, getStats]
  );
}
