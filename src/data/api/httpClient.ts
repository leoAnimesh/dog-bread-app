import { sleep } from '@/utils/sleep';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly url: string,
    message?: string,
  ) {
    super(message ?? `HTTP ${status} for ${url}`);
    this.name = 'HttpError';
  }
}

export class NetworkError extends Error {
  constructor(
    public readonly url: string,
    cause?: unknown,
  ) {
    super(`Network request failed for ${url}`, { cause });
    this.name = 'NetworkError';
  }
}

export interface RetryPolicy {
  /** Total attempts including the first one */
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  /** Adds up to this fraction of the delay as random jitter */
  jitterRatio: number;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 4,
  baseDelayMs: 400,
  maxDelayMs: 6_000,
  jitterRatio: 0.25,
};

export interface HttpClientOptions {
  baseUrl: string;
  fetchFn?: typeof fetch;
  retry?: Partial<RetryPolicy>;
  timeoutMs?: number;
  /** Injected for deterministic tests */
  random?: () => number;
  sleepFn?: (ms: number) => Promise<void>;
}

export interface HttpClient {
  getJson(path: string, signal?: AbortSignal): Promise<unknown>;
}

/** 5xx and 429 are transient; 4xx otherwise are not worth retrying. */
export function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

/** Exponential backoff: base * 2^attempt, capped, with jitter. Exported for tests. */
export function computeBackoffMs(
  attempt: number,
  policy: RetryPolicy,
  random: () => number = Math.random,
): number {
  const exponential = Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** attempt);
  const jitter = exponential * policy.jitterRatio * random();
  return Math.round(exponential + jitter);
}

/**
 * Thin fetch wrapper: JSON decoding, timeouts and retry with exponential
 * backoff. It knows nothing about the Dog API — that lives in dogApi.ts (SRP).
 */
export function createHttpClient(options: HttpClientOptions): HttpClient {
  const fetchFn = options.fetchFn ?? fetch;
  const policy: RetryPolicy = { ...DEFAULT_RETRY_POLICY, ...options.retry };
  const timeoutMs = options.timeoutMs ?? 15_000;
  const random = options.random ?? Math.random;
  const sleepFn = options.sleepFn ?? sleep;
  const baseUrl = options.baseUrl.replace(/\/+$/, '');

  async function attemptOnce(url: string, outerSignal?: AbortSignal): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const onOuterAbort = () => controller.abort();
    outerSignal?.addEventListener('abort', onOuterAbort);

    try {
      let response: Response;
      try {
        response = await fetchFn(url, {
          headers: { Accept: 'application/vnd.api+json, application/json' },
          signal: controller.signal,
        });
      } catch (cause) {
        throw new NetworkError(url, cause);
      }
      if (!response.ok) {
        throw new HttpError(response.status, url);
      }
      return (await response.json()) as unknown;
    } finally {
      clearTimeout(timer);
      outerSignal?.removeEventListener('abort', onOuterAbort);
    }
  }

  return {
    async getJson(path, signal) {
      const url = path.startsWith('http') ? path : `${baseUrl}/${path.replace(/^\/+/, '')}`;
      let lastError: unknown;

      for (let attempt = 0; attempt < policy.maxAttempts; attempt += 1) {
        if (signal?.aborted) throw new NetworkError(url, 'aborted');
        try {
          return await attemptOnce(url, signal);
        } catch (error) {
          lastError = error;
          const retryable =
            error instanceof NetworkError ||
            (error instanceof HttpError && isRetryableStatus(error.status));
          const isLast = attempt === policy.maxAttempts - 1;
          if (!retryable || isLast) throw error;
          await sleepFn(computeBackoffMs(attempt, policy, random));
        }
      }
      throw lastError instanceof Error ? lastError : new Error('Request failed');
    },
  };
}
