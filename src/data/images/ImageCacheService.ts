import { Directory, File, Paths } from 'expo-file-system';

import type {
  ImageCacheEntry,
  ImageCacheRepository,
  ImageVariant,
} from '@/data/db/repositories/ImageCacheRepository';

export type CacheChangeListener = (totalBytes: number) => void;

export interface ImageCacheService {
  /** Warm the in-memory index from SQLite so lookups are synchronous. */
  hydrate(): Promise<void>;
  /** Synchronous: local file URI if cached, otherwise null. */
  getLocalUri(url: string): string | null;
  /**
   * Ensures the image is on disk. Resolves to the local URI, or the remote URL
   * when download fails (the UI then falls back to network rendering).
   */
  ensure(url: string, variant: ImageVariant): Promise<string>;
  /** Fire-and-forget batch prefetch — used for list thumbnails. */
  prefetch(urls: readonly string[], variant: ImageVariant): void;
  totalBytes(): number;
  clear(): Promise<void>;
  subscribe(listener: CacheChangeListener): () => void;
}

export interface ImageCacheDeps {
  repo: ImageCacheRepository;
  limitBytes: number;
  directoryName?: string;
  now?: () => number;
}

/** Deterministic, filesystem-safe file name for a URL. */
export function fileNameForUrl(url: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < url.length; i += 1) {
    hash ^= url.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  const tail = url.split('/').pop()?.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24) ?? 'img';
  return `${hash.toString(16)}-${tail}`;
}

/**
 * Pure LRU selection: which entries to evict so the total fits the budget.
 * Entries must be sorted oldest-access first. Exported for tests.
 */
export function selectEvictions(
  entries: readonly ImageCacheEntry[],
  totalBytes: number,
  limitBytes: number,
  protectedUrls: ReadonlySet<string> = new Set(),
): ImageCacheEntry[] {
  const evicted: ImageCacheEntry[] = [];
  let running = totalBytes;
  for (const entry of entries) {
    if (running <= limitBytes) break;
    if (protectedUrls.has(entry.url)) continue;
    evicted.push(entry);
    running -= entry.bytes;
  }
  return evicted;
}

export function createImageCacheService(deps: ImageCacheDeps): ImageCacheService {
  const now = deps.now ?? (() => Date.now());
  const index = new Map<string, ImageCacheEntry>();
  const pending = new Map<string, Promise<string>>();
  const listeners = new Set<CacheChangeListener>();
  let total = 0;
  const directory = new Directory(Paths.cache, deps.directoryName ?? 'breed-images');

  const notify = () => {
    for (const l of listeners) l(total);
  };

  function ensureDirectory(): void {
    if (!directory.exists) directory.create({ idempotent: true, intermediates: true });
  }

  async function evictIfNeeded(protectedUrl: string): Promise<void> {
    if (total <= deps.limitBytes) return;
    const sorted = [...index.values()].sort((a, b) => a.lastAccess - b.lastAccess);
    const victims = selectEvictions(sorted, total, deps.limitBytes, new Set([protectedUrl]));
    if (victims.length === 0) return;
    for (const victim of victims) {
      try {
        const file = new File(victim.localUri);
        if (file.exists) file.delete();
      } catch {
        // File already gone — the index is the source of truth.
      }
      index.delete(victim.url);
      total -= victim.bytes;
    }
    await deps.repo.remove(victims.map((v) => v.url));
  }

  async function download(url: string, variant: ImageVariant): Promise<string> {
    ensureDirectory();
    const target = new File(directory, fileNameForUrl(url));
    if (target.exists) target.delete();
    const file = await File.downloadFileAsync(url, target);
    const bytes = file.size ?? 0;
    const entry: ImageCacheEntry = {
      url,
      localUri: file.uri,
      variant,
      bytes,
      lastAccess: now(),
    };
    index.set(url, entry);
    total += bytes;
    await deps.repo.upsert(entry);
    await evictIfNeeded(url);
    notify();
    return entry.localUri;
  }

  return {
    async hydrate() {
      const entries = await deps.repo.getAll();
      index.clear();
      total = 0;
      const stale: string[] = [];
      for (const entry of entries) {
        // Drop rows whose file vanished (OS cache purge).
        let exists = false;
        try {
          exists = new File(entry.localUri).exists;
        } catch {
          exists = false;
        }
        if (!exists) {
          stale.push(entry.url);
          continue;
        }
        index.set(entry.url, entry);
        total += entry.bytes;
      }
      if (stale.length > 0) await deps.repo.remove(stale);
      notify();
    },

    getLocalUri(url) {
      const entry = index.get(url);
      if (!entry) return null;
      const t = now();
      // Throttle touches: only persist when the last access is older than a minute.
      if (t - entry.lastAccess > 60_000) {
        entry.lastAccess = t;
        void deps.repo.touch(url, t).catch(() => undefined);
      }
      return entry.localUri;
    },

    async ensure(url, variant) {
      const local = this.getLocalUri(url);
      if (local) return local;
      const existing = pending.get(url);
      if (existing) return existing;
      const task = download(url, variant)
        .catch(() => url)
        .finally(() => pending.delete(url));
      pending.set(url, task);
      return task;
    },

    prefetch(urls, variant) {
      for (const url of urls) {
        if (!index.has(url) && !pending.has(url)) void this.ensure(url, variant);
      }
    },

    totalBytes: () => total,

    async clear() {
      for (const entry of index.values()) {
        try {
          const file = new File(entry.localUri);
          if (file.exists) file.delete();
        } catch {
          // ignore
        }
      }
      index.clear();
      total = 0;
      await deps.repo.clear();
      notify();
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
