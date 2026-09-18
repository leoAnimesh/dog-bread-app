import { create } from 'zustand';

import { EMPTY_SYNC_META, type SyncMeta } from '@/data/db/repositories/SyncMetaRepository';
import type { SyncProgress } from '@/data/sync/SyncService';

export type SyncStatus = 'idle' | 'syncing' | 'error';

export interface SyncState {
  status: SyncStatus;
  progress: SyncProgress | null;
  meta: SyncMeta;
  isOnline: boolean;
  /** A sync was requested while offline and will run on reconnect */
  queuedSync: boolean;
  lastError: string | null;

  setOnline(isOnline: boolean): void;
  setQueued(queued: boolean): void;
  syncStarted(): void;
  syncProgress(progress: SyncProgress): void;
  syncFinished(meta: SyncMeta, error: string | null): void;
  setMeta(meta: SyncMeta): void;
}

export const useSyncStore = create<SyncState>((set) => ({
  status: 'idle',
  progress: null,
  meta: EMPTY_SYNC_META,
  isOnline: true,
  queuedSync: false,
  lastError: null,

  setOnline: (isOnline) => set({ isOnline }),
  setQueued: (queuedSync) => set({ queuedSync }),
  syncStarted: () => set({ status: 'syncing', progress: null, lastError: null }),
  syncProgress: (progress) => set({ progress }),
  syncFinished: (meta, error) =>
    set({ status: error ? 'error' : 'idle', progress: null, meta, lastError: error }),
  setMeta: (meta) => set({ meta }),
}));
