import { isRecord } from '@/utils/guards';

import type { Database } from '../database';

/** Persisted outcome of the last sync run — drives the freshness UI. */
export interface SyncMeta {
  /** Epoch ms of the last *fully or partially* successful sync, null if never */
  lastSyncedAt: number | null;
  /** Epoch ms of the last attempt regardless of outcome */
  lastAttemptAt: number | null;
  totalPages: number;
  /** Page numbers that failed in the last run; empty means everything merged */
  failedPages: number[];
  totalRecords: number | null;
}

export const EMPTY_SYNC_META: SyncMeta = {
  lastSyncedAt: null,
  lastAttemptAt: null,
  totalPages: 0,
  failedPages: [],
  totalRecords: null,
};

export interface SyncMetaRepository {
  get(): Promise<SyncMeta>;
  set(meta: SyncMeta): Promise<void>;
}

const KEY = 'breeds_sync';

export function createSyncMetaRepository(db: Database): SyncMetaRepository {
  return {
    async get() {
      const row = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM sync_meta WHERE key = ?',
        KEY,
      );
      if (!row) return EMPTY_SYNC_META;
      try {
        const parsed: unknown = JSON.parse(row.value);
        if (!isRecord(parsed)) return EMPTY_SYNC_META;
        return {
          lastSyncedAt: typeof parsed.lastSyncedAt === 'number' ? parsed.lastSyncedAt : null,
          lastAttemptAt: typeof parsed.lastAttemptAt === 'number' ? parsed.lastAttemptAt : null,
          totalPages: typeof parsed.totalPages === 'number' ? parsed.totalPages : 0,
          failedPages: Array.isArray(parsed.failedPages)
            ? parsed.failedPages.filter((p): p is number => typeof p === 'number')
            : [],
          totalRecords: typeof parsed.totalRecords === 'number' ? parsed.totalRecords : null,
        };
      } catch {
        return EMPTY_SYNC_META;
      }
    },

    async set(meta) {
      await db.runAsync(
        `INSERT INTO sync_meta (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        [KEY, JSON.stringify(meta)],
      );
    },
  };
}
