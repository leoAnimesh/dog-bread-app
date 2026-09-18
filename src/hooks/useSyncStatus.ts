import { useMemo } from 'react';

import { env } from '@/config/env';
import { useSyncStore } from '@/store/useSyncStore';
import { formatRelativeTime } from '@/utils/time';

import { useNow } from './useNow';

export type FreshnessState = 'never' | 'syncing' | 'fresh' | 'stale' | 'offline' | 'partial';

export interface SyncStatusView {
  state: FreshnessState;
  isOnline: boolean;
  isSyncing: boolean;
  /** "Synced 12 min ago" */
  label: string;
  /** Percentage while syncing, empty otherwise */
  detail: string;
  /** 0..1 while syncing */
  progressRatio: number | null;
  lastSyncedAt: number | null;
  failedPages: number[];
  totalPages: number;
  queuedSync: boolean;
  lastError: string | null;
}

/** Turns raw sync store state into the six header states from the design. */
export function useSyncStatus(): SyncStatusView {
  const status = useSyncStore((s) => s.status);
  const progress = useSyncStore((s) => s.progress);
  const meta = useSyncStore((s) => s.meta);
  const isOnline = useSyncStore((s) => s.isOnline);
  const queuedSync = useSyncStore((s) => s.queuedSync);
  const lastError = useSyncStore((s) => s.lastError);
  const now = useNow(30_000);

  return useMemo(() => {
    const isSyncing = status === 'syncing';
    const synced = meta.lastSyncedAt;
    const relative = synced ? formatRelativeTime(synced, now) : null;
    const isStale = synced === null || now - synced > env.staleAfterMs;

    let state: FreshnessState;
    if (isSyncing) state = 'syncing';
    else if (!isOnline) state = 'offline';
    else if (meta.failedPages.length > 0) state = 'partial';
    else if (synced === null) state = 'never';
    else if (isStale) state = 'stale';
    else state = 'fresh';

    const label =
      state === 'syncing'
        ? progress
          ? `Syncing page ${Math.min(progress.completedPages + 1, progress.totalPages)} of ${progress.totalPages}`
          : 'Syncing…'
        : relative
          ? `Synced ${relative}`
          : 'Never synced';

    const detail =
      state === 'syncing' && progress
        ? `${Math.round((progress.completedPages / Math.max(1, progress.totalPages)) * 100)}%`
        : '';

    return {
      state,
      isOnline,
      isSyncing,
      label,
      detail,
      progressRatio:
        isSyncing && progress ? progress.completedPages / Math.max(1, progress.totalPages) : null,
      lastSyncedAt: synced,
      failedPages: meta.failedPages,
      totalPages: meta.totalPages,
      queuedSync,
      lastError,
    };
  }, [status, progress, meta, isOnline, queuedSync, lastError, now]);
}
