/**
 * Retry Utility
 * Provides configurable retry logic with exponential backoff
 */

/**
 * Retry configuration options
 */
export interface RetryOptions {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number;

  /**
   * Base delay in milliseconds between retries
   * @default 1000
   */
  baseDelay?: number;

  /**
   * Maximum delay in milliseconds (caps exponential growth)
   * @default 30000
   */
  maxDelay?: number;

  /**
   * Multiplier for exponential backoff
   * @default 2
   */
  backoffMultiplier?: number;

  /**
   * Add random jitter to delays (helps prevent thundering herd)
   * @default true
   */
  jitter?: boolean;

  /**
   * Function to determine if an error is retryable
   * @default Returns true for network errors and 5xx status codes
   */
  isRetryable?: (error: unknown) => boolean;

  /**
   * Callback invoked before each retry attempt
   */
  onRetry?: (error: unknown, attempt: number, delay: number) => void;

  /**
   * Operation name for logging
   */
  operationName?: string;
}

/**
 * Retry result containing success status and metadata
 */
export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: unknown;
  attempts: number;
  totalDuration: number;
}

/**
 * Default retry options
 */
const defaultOptions: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true,
  isRetryable: defaultIsRetryable,
  onRetry: () => {},
  operationName: 'operation',
};

/**
 * Default function to determine if an error is retryable
 */
function defaultIsRetryable(error: unknown): boolean {
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  // HTTP response errors
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    // Retry on 5xx errors and 429 (rate limit)
    return status >= 500 || status === 429;
  }

  // Error with code (Node.js style)
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: string }).code;
    const retryableCodes = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'EPIPE',
      'ENOTFOUND',
      'ENETUNREACH',
      'EAI_AGAIN',
    ];
    return retryableCodes.includes(code);
  }

  return false;
}

/**
 * Calculate delay with optional jitter
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  // Exponential backoff: baseDelay * (multiplier ^ attempt)
  let delay = options.baseDelay * Math.pow(options.backoffMultiplier, attempt);

  // Cap at maximum delay
  delay = Math.min(delay, options.maxDelay);

  // Add jitter (up to ±25%)
  // NOTE: Using Math.random() here is intentional - jitter for retry timing
  // does not require cryptographic security, just some variation
  if (options.jitter) {
    const jitterRange = delay * 0.25;
    delay = delay + (Math.random() * jitterRange * 2 - jitterRange);
  }

  return Math.round(delay);
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute an operation with retry logic
 *
 * @param operation Async function to execute
 * @param options Retry configuration
 * @returns Promise resolving to operation result
 * @throws Last error if all retries are exhausted
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => fetch('https://api.example.com/data'),
 *   { maxRetries: 3, operationName: 'fetchData' }
 * );
 * ```
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts: Required<RetryOptions> = { ...defaultOptions, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Check if we've exhausted retries
      if (attempt >= opts.maxRetries) {
        break;
      }

      // Check if error is retryable
      if (!opts.isRetryable(error)) {
        throw error;
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, opts);
      opts.onRetry(error, attempt + 1, delay);

      if (process.env.NODE_ENV === 'development') {
        console.log(
          `[Retry] ${opts.operationName} failed (attempt ${attempt + 1}/${opts.maxRetries + 1}), ` +
            `retrying in ${delay}ms...`
        );
      }

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Execute an operation with retry logic, returning a result object instead of throwing
 *
 * @param operation Async function to execute
 * @param options Retry configuration
 * @returns Promise resolving to retry result
 *
 * @example
 * ```typescript
 * const result = await withRetryResult(
 *   () => fetch('https://api.example.com/data'),
 *   { maxRetries: 3 }
 * );
 *
 * if (result.success) {
 *   console.log('Data:', result.data);
 * } else {
 *   console.error('Failed after', result.attempts, 'attempts');
 * }
 * ```
 */
export async function withRetryResult<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const startTime = Date.now();
  let attempts = 0;

  try {
    const data = await withRetry(async () => {
      attempts++;
      return operation();
    }, options);

    return {
      success: true,
      data,
      attempts,
      totalDuration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error,
      attempts,
      totalDuration: Date.now() - startTime,
    };
  }
}

/**
 * Create a retryable version of a function
 *
 * @param fn Function to wrap with retry logic
 * @param options Default retry options
 * @returns Wrapped function with retry capability
 *
 * @example
 * ```typescript
 * const fetchWithRetry = createRetryable(
 *   async (url: string) => fetch(url).then(r => r.json()),
 *   { maxRetries: 3 }
 * );
 *
 * const data = await fetchWithRetry('https://api.example.com/data');
 * ```
 */
export function createRetryable<Args extends unknown[], Return>(
  fn: (...args: Args) => Promise<Return>,
  options: RetryOptions = {}
): (...args: Args) => Promise<Return> {
  return (...args: Args) => withRetry(() => fn(...args), options);
}

/**
 * Preset configurations for common use cases
 */
export const RetryPresets = {
  /**
   * Quick retry for fast operations
   */
  quick: {
    maxRetries: 2,
    baseDelay: 500,
    maxDelay: 2000,
  } as RetryOptions,

  /**
   * Standard retry for most operations
   */
  standard: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
  } as RetryOptions,

  /**
   * Aggressive retry for critical operations
   */
  aggressive: {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 30000,
  } as RetryOptions,

  /**
   * Patient retry for slow/rate-limited operations
   */
  patient: {
    maxRetries: 3,
    baseDelay: 5000,
    maxDelay: 60000,
    backoffMultiplier: 3,
  } as RetryOptions,
} as const;

export default withRetry;
