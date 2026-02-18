/**
 * chunkLoadHandler.ts
 *
 * Utility for detecting and handling ChunkLoadError with retry logic.
 * Provides exponential backoff, retry state persistence, and max retry limits.
 *
 * Used by ChartErrorBoundary for recovering from lazy-loaded chunk failures.
 */

/**
 * Configuration for chunk load retry behavior
 */
export interface ChunkLoadRetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Enable exponential backoff delay (default: true) */
  useExponentialBackoff?: boolean;
  /** Base delay in milliseconds (default: 1000ms) */
  baseDelayMs?: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffFactor?: number;
  /** localStorage key prefix for retry state (default: 'chunk_retry_') */
  storageKeyPrefix?: string;
  /** Unique storage key for this retry manager */
  storageKey?: string;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: Required<Omit<ChunkLoadRetryConfig, 'storageKey'>> = {
  maxRetries: 3,
  useExponentialBackoff: true,
  baseDelayMs: 1000,
  backoffFactor: 2,
  storageKeyPrefix: 'chunk_retry_',
};

/**
 * Retry state persisted in localStorage
 */
interface RetryState {
  retryCount: number;
  lastRetryAt: number;
}

/**
 * Options for retry execution
 */
export interface RetryOptions {
  /** Add delay before retry attempt (default: false) */
  delayBeforeRetry?: boolean;
}

/**
 * Checks if an error is related to chunk loading
 *
 * @param error - Error to check
 * @returns true if error is a ChunkLoadError or contains chunk loading patterns
 */
export function isChunkLoadError(error: Error | null | undefined): boolean {
  if (!error) return false;

  // Check error name first (most reliable)
  if (error.name === 'ChunkLoadError') {
    return true;
  }

  // Check message for known patterns
  const message = error.message.toLowerCase();
  const chunkErrorPatterns = ['chunkloaderror', 'loading chunk', 'chunk loading'];

  return chunkErrorPatterns.some((pattern) => message.includes(pattern));
}

/**
 * Manages retry state and logic for chunk loading failures
 *
 * Features:
 * - Retry count tracking with persistence across component remounts
 * - Exponential backoff delay calculation
 * - Max retry limit enforcement
 * - Automatic reset on successful load
 */
export class ChunkLoadRetryManager {
  private config: Required<ChunkLoadRetryConfig>;

  constructor(config: ChunkLoadRetryConfig = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? DEFAULT_RETRY_CONFIG.maxRetries,
      useExponentialBackoff: config.useExponentialBackoff ?? DEFAULT_RETRY_CONFIG.useExponentialBackoff,
      baseDelayMs: config.baseDelayMs ?? DEFAULT_RETRY_CONFIG.baseDelayMs,
      backoffFactor: config.backoffFactor ?? DEFAULT_RETRY_CONFIG.backoffFactor,
      storageKeyPrefix: config.storageKeyPrefix ?? DEFAULT_RETRY_CONFIG.storageKeyPrefix,
      storageKey:
        config.storageKey ??
        `${DEFAULT_RETRY_CONFIG.storageKeyPrefix}${Date.now()}_${Math.random().toString(36).slice(2)}`,
    };
  }

  /**
   * Loads retry state from localStorage
   */
  private getState(): RetryState | null {
    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (!stored) return null;

      const parsed = JSON.parse(stored) as Partial<RetryState>;

      // Validate and sanitize
      return {
        retryCount: typeof parsed.retryCount === 'number' ? Math.max(0, parsed.retryCount) : 0,
        lastRetryAt: typeof parsed.lastRetryAt === 'number' ? parsed.lastRetryAt : Date.now(),
      };
    } catch {
      // Corrupted data or localStorage unavailable
      return null;
    }
  }

  /**
   * Saves retry state to localStorage
   */
  private setState(state: RetryState): void {
    try {
      localStorage.setItem(this.config.storageKey, JSON.stringify(state));
    } catch {
      // localStorage quota exceeded or access denied (private browsing)
      // Continue without persistence - retry still works in current session
    }
  }

  /**
   * Gets current retry count
   */
  getRetryCount(): number {
    return this.getState()?.retryCount ?? 0;
  }

  /**
   * Increments retry count and persists to localStorage
   */
  incrementRetry(): void {
    const currentState = this.getState();
    const newState: RetryState = {
      retryCount: (currentState?.retryCount ?? 0) + 1,
      lastRetryAt: Date.now(),
    };
    this.setState(newState);
  }

  /**
   * Resets retry count and clears persisted state
   */
  reset(): void {
    try {
      localStorage.removeItem(this.config.storageKey);
    } catch {
      // Ignore cleanup errors
    }
  }

  /**
   * Checks if more retries are available
   */
  canRetry(): boolean {
    const retryCount = this.getRetryCount();
    return retryCount < this.config.maxRetries;
  }

  /**
   * Calculates delay before next retry using exponential backoff
   *
   * @returns Delay in milliseconds (capped at 30 seconds)
   */
  getRetryDelay(): number {
    const retryCount = this.getRetryCount();

    if (!this.config.useExponentialBackoff) {
      return this.config.baseDelayMs;
    }

    // Exponential backoff: baseDelay * (factor ^ retryCount)
    const exponentialDelay = this.config.baseDelayMs * Math.pow(this.config.backoffFactor, retryCount);

    // Cap at 30 seconds maximum
    return Math.min(exponentialDelay, 30000);
  }

  /**
   * Executes a callback with retry logic
   *
   * - Retries only on ChunkLoadError
   * - Increments retry count on each failure
   * - Resets retry count on success
   * - Throws error if max retries exceeded
   * - Automatically retries with exponential backoff when delayBeforeRetry is true
   * - Without delayBeforeRetry: increments count and throws (caller must manually retry)
   *
   * @param callback - Function to execute with retry support
   * @param options - Retry execution options
   * @returns Promise that resolves with callback result
   * @throws Error if max retries exceeded or non-retryable error occurs
   */
  async retry<T>(callback: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
    const { delayBeforeRetry = false } = options;

    // Check if retries available before attempting
    if (!this.canRetry()) {
      throw new Error('Maximum retry attempts exceeded. Please refresh the page.');
    }

    try {
      const result = await callback();

      // Success: reset retry count
      this.reset();
      return result;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));

      // Only retry ChunkLoadError
      if (!isChunkLoadError(errorObj)) {
        throw error;
      }

      // Increment retry count
      this.incrementRetry();

      // Check if more retries available after increment
      if (!this.canRetry()) {
        throw new Error(
          `Maximum retry attempts (${this.config.maxRetries}) exceeded. Please refresh the page.`
        );
      }

      // If delayBeforeRetry is enabled, automatically retry with delay
      if (delayBeforeRetry) {
        await this.delay();
        return this.retry(callback, options);
      }

      // Otherwise, throw and let caller decide when to retry
      throw error;
    }
  }

  /**
   * Delays execution based on calculated retry delay
   */
  private async delay(): Promise<void> {
    const delayMs = this.getRetryDelay();
    return new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

// Note: Named exports are used instead of default export for better tree-shaking
// export default is not needed as all exports are named
