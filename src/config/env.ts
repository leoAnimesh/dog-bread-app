/**
 * Typed access to EXPO_PUBLIC_* variables. Every value has a sane default so
 * the app boots even without a .env file (README quick start still copies one).
 */

function readNumber(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readString(raw: string | undefined, fallback: string): string {
  return raw && raw.trim().length > 0 ? raw.trim() : fallback;
}

export const env = {
  apiBaseUrl: readString(process.env.EXPO_PUBLIC_API_BASE_URL, 'https://dogapi.dog/api/v2'),
  apiPageSize: Math.min(48, readNumber(process.env.EXPO_PUBLIC_API_PAGE_SIZE, 48)),
  staleAfterMs: readNumber(process.env.EXPO_PUBLIC_STALE_AFTER_MINUTES, 60) * 60 * 1000,
  imageCacheLimitBytes: readNumber(process.env.EXPO_PUBLIC_IMAGE_CACHE_LIMIT_MB, 60) * 1024 * 1024,
  searchDebounceMs: readNumber(process.env.EXPO_PUBLIC_SEARCH_DEBOUNCE_MS, 300),
} as const;

export type Env = typeof env;
