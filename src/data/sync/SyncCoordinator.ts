import type { SyncMetaRepository } from '@/data/db/repositories/SyncMetaRepository';

import type { NetworkMonitor } from './NetworkMonitor';
import type { SyncReason, SyncService } from './SyncService';

export interface SyncCoordinatorDeps {
  sync: SyncService;
  network: NetworkMonitor;
  meta: SyncMetaRepository;
  staleAfterMs: number;
  now?: () => number;
}

export interface SyncCoordinator {
  /** Decide whether the cache is stale/incomplete and sync if so. */
  syncIfNeeded(reason: SyncReason): Promise<void>;
  /** Called on pull-to-refresh / sync button. Queues when offline. */
  requestSync(reason: SyncReason): Promise<void>;
  hasQueuedSync(): boolean;
  subscribeQueued(listener: (queued: boolean) => void): () => void;
  start(): () => void;
}

export function isStale(lastSyncedAt: number | null, staleAfterMs: number, now: number): boolean {
  if (lastSyncedAt === null) return true;
  return now - lastSyncedAt > staleAfterMs;
}

/**
 * Policy layer on top of SyncService: knows *when* to sync (staleness,
 * reconnects, queued requests) so SyncService only knows *how*.
 */
export function createSyncCoordinator(deps: SyncCoordinatorDeps): SyncCoordinator {
  const now = deps.now ?? (() => Date.now());
  let queued: SyncReason | null = null;
  const queueListeners = new Set<(queued: boolean) => void>();

  const setQueued = (reason: SyncReason | null) => {
    queued = reason;
    for (const l of queueListeners) l(queued !== null);
  };

  async function syncIfNeeded(reason: SyncReason): Promise<void> {
    if (!deps.network.isOnline()) return;
    const meta = await deps.meta.get();
    const needs =
      isStale(meta.lastSyncedAt, deps.staleAfterMs, now()) || meta.failedPages.length > 0;
    if (!needs) return;
    if (meta.failedPages.length > 0 && !isStale(meta.lastSyncedAt, deps.staleAfterMs, now())) {
      await deps.sync.retryFailedPages();
    } else {
      await deps.sync.syncAll(reason);
    }
  }

  async function requestSync(reason: SyncReason): Promise<void> {
    if (!deps.network.isOnline()) {
      setQueued(reason);
      return;
    }
    await deps.sync.syncAll(reason);
  }

  return {
    syncIfNeeded,
    requestSync,
    hasQueuedSync: () => queued !== null,
    subscribeQueued(listener) {
      queueListeners.add(listener);
      return () => queueListeners.delete(listener);
    },
    start() {
      const unsubscribe = deps.network.subscribe((online) => {
        if (!online) return;
        if (queued) {
          const reason = queued;
          setQueued(null);
          void deps.sync.syncAll(reason);
        } else {
          void syncIfNeeded('reconnect');
        }
      });
      return unsubscribe;
    },
  };
}
