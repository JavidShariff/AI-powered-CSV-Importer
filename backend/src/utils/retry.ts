export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export interface RetryOptions {
  retries: number;
  baseMs: number;
  factor?: number;
  jitter?: boolean;
  onRetry?: (err: unknown, attempt: number, delay: number) => void;
  shouldRetry?: (err: unknown) => boolean;
}

/**
 * Retry an async operation with exponential backoff + jitter.
 * Total attempts = retries + 1.
 */
export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  opts: RetryOptions,
): Promise<{ value: T; attempts: number }> {
  const { retries, baseMs, factor = 2, jitter = true, onRetry, shouldRetry } = opts;
  let attempt = 0;
  let lastErr: unknown;

  while (attempt <= retries) {
    try {
      const value = await fn(attempt + 1);
      return { value, attempts: attempt + 1 };
    } catch (err) {
      lastErr = err;
      if (shouldRetry && !shouldRetry(err)) throw err;
      if (attempt === retries) break;

      let delay = baseMs * Math.pow(factor, attempt); // 5s, 10s, 20s

      // Respect Gemini / Google Cloud "Retry-After" if present in err message or object
      let retryAfter = 0;
      const msg = err instanceof Error ? err.message : String(err);
      const retryMatch = msg.match(/retry(?: after| in)? (\d+) seconds?/i);
      if (retryMatch && retryMatch[1]) {
        retryAfter = parseInt(retryMatch[1], 10) * 1000;
      }

      if (retryAfter > 0) {
        delay = retryAfter;
      } else if (jitter) {
        delay = Math.round(delay * (0.8 + Math.random() * 0.4));
      }

      onRetry?.(err, attempt + 1, delay);
      await sleep(delay);
      attempt++;
    }
  }
  throw lastErr;
}
