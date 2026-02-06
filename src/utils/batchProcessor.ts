/**
 * Batch Processing Utility
 *
 * Processes items in configurable batches with progress callbacks to prevent
 * memory overload and keep UI responsive during heavy operations.
 */

export interface BatchProcessOptions {
  /** Number of items to process concurrently (default: 3) */
  concurrency?: number;
  /** Callback for progress updates */
  onProgress?: (completed: number, total: number) => void;
}

export interface BatchResult<T, E = unknown> {
  /** Successfully processed items */
  successful: T[];
  /** Errors from failed items */
  errors: BatchError<E>[];
}

export interface BatchError<E = unknown> {
  /** The original item that failed */
  item: unknown;
  /** The error that occurred */
  error: E;
}

/**
 * Process an array of items in batches with configurable concurrency.
 *
 * @param items - Array of items to process
 * @param processor - Async function that processes a single item
 * @param options - Batch processing options
 * @returns Promise resolving to successful results and errors
 *
 * @example
 * ```typescript
 * const results = await processInBatches(
 *   files,
 *   async (file) => parseExcelFile(file),
 *   {
 *     concurrency: 3,
 *     onProgress: (completed, total) => console.log(`${completed}/${total}`)
 *   }
 * );
 * ```
 */
export async function processInBatches<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: BatchProcessOptions = {}
): Promise<R[]> {
  const { concurrency = 3, onProgress } = options;

  const results: R[] = [];
  const errors: BatchError[] = [];

  // Process items in batches
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);

    // Process all items in current batch concurrently
    const batchPromises = batch.map(async (item) => {
      try {
        const data = await processor(item);
        return { success: true, data, item: null as never };
      } catch (error) {
        return { success: false, error, item };
      }
    });

    const batchResults = await Promise.all(batchPromises);

    // Separate successful and failed results
    for (const result of batchResults) {
      if (result.success) {
        results.push(result.data as R);
      } else {
        errors.push({ item: result.item, error: result.error });
      }
    }

    // Report progress
    const completed = Math.min(i + concurrency, items.length);
    onProgress?.(completed, items.length);

    // Allow UI to update between batches
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  // If there were errors, log them but don't fail the entire operation
  if (errors.length > 0) {
    console.warn(`Completed with ${errors.length} errors:`, errors);
  }

  return results;
}

/**
 * Process items with detailed error information returned.
 *
 * @param items - Array of items to process
 * @param processor - Async function that processes a single item
 * @param options - Batch processing options
 * @returns Promise resolving to successful results and errors
 *
 * @example
 * ```typescript
 * const { successful, errors } = await processInBatchesWithErrors(
 *   files,
 *   async (file) => parseExcelFile(file),
 *   { concurrency: 3 }
 * );
 *
 * if (errors.length > 0) {
 *   console.error(`${errors.length} files failed to parse`);
 * }
 * ```
 */
export async function processInBatchesWithErrors<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: BatchProcessOptions = {}
): Promise<BatchResult<R>> {
  const { concurrency = 3, onProgress } = options;

  const successful: R[] = [];
  const errors: BatchError[] = [];

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);

    const batchPromises = batch.map(async (item) => {
      try {
        const data = await processor(item);
        return { success: true, data, item: null as never };
      } catch (error) {
        return { success: false, error, item };
      }
    });

    const batchResults = await Promise.all(batchPromises);

    for (const result of batchResults) {
      if (result.success) {
        successful.push(result.data as R);
      } else {
        errors.push({ item: result.item, error: result.error });
      }
    }

    const completed = Math.min(i + concurrency, items.length);
    onProgress?.(completed, items.length);

    await new Promise(resolve => setTimeout(resolve, 0));
  }

  return { successful, errors };
}
