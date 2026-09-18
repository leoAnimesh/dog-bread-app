import { EMPTY_SYNC_META, type SyncMeta } from '@/data/db/repositories/SyncMetaRepository';
import type { NetworkMonitor } from '@/data/sync/NetworkMonitor';
import { createSyncCoordinator, isStale } from '@/data/sync/SyncCoordinator';
import type { SyncResult, SyncService } from '@/data/sync/SyncService';

function fakeNetwork(initial: boolean) {
  let online = initial;
  const listeners = new Set<(o: boolean) => void>();
  const monitor: NetworkMonitor = {
    isOnline: () => online,
    subscribe: (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    refresh: async () => online,
  };
  return {
    monitor,
    set(next: boolean) {
      online = next;
      for (const l of listeners) l(next);
    },
  };
}

function fakeSync() {
  const result = { complete: true } as unknown as SyncResult;
  const sync: SyncService = {
    syncAll: jest.fn(() => Promise.resolve(result)),
    retryFailedPages: jest.fn(() => Promise.resolve(result)),
    refreshBreed: jest.fn(),
    subscribe: () => () => undefined,
    isRunning: () => false,
  };
  return sync;
}

function metaRepo(initial: SyncMeta) {
  let meta = initial;
  return {
    get: async () => meta,
    set: async (m: SyncMeta) => {
      meta = m;
    },
  };
}

describe('isStale', () => {
  it('is stale when never synced or past the window', () => {
    expect(isStale(null, 1000, 5000)).toBe(true);
    expect(isStale(4500, 1000, 5000)).toBe(false);
    expect(isStale(3000, 1000, 5000)).toBe(true);
  });
});

describe('SyncCoordinator', () => {
  const HOUR = 3_600_000;

  it('syncIfNeeded: skips when fresh, full sync when stale, retry when only pages failed', async () => {
    const net = fakeNetwork(true);
    const sync = fakeSync();
    const repo = metaRepo({ ...EMPTY_SYNC_META, lastSyncedAt: 10_000, totalPages: 6 });
    const c = createSyncCoordinator({ sync, network: net.monitor, meta: repo, staleAfterMs: HOUR, now: () => 20_000 });

    await c.syncIfNeeded('stale');
    expect(sync.syncAll).not.toHaveBeenCalled();

    await repo.set({ ...EMPTY_SYNC_META, lastSyncedAt: 10_000, totalPages: 6, failedPages: [4] });
    await c.syncIfNeeded('reconnect');
    expect(sync.retryFailedPages).toHaveBeenCalledTimes(1);

    await repo.set({ ...EMPTY_SYNC_META, lastSyncedAt: 10_000 - 2 * HOUR });
    await c.syncIfNeeded('stale');
    expect(sync.syncAll).toHaveBeenCalledWith('stale');
  });

  it('syncIfNeeded does nothing offline', async () => {
    const net = fakeNetwork(false);
    const sync = fakeSync();
    const c = createSyncCoordinator({ sync, network: net.monitor, meta: metaRepo(EMPTY_SYNC_META), staleAfterMs: HOUR });
    await c.syncIfNeeded('initial');
    expect(sync.syncAll).not.toHaveBeenCalled();
  });

  it('requestSync while offline queues and runs on reconnect', async () => {
    const net = fakeNetwork(false);
    const sync = fakeSync();
    const c = createSyncCoordinator({ sync, network: net.monitor, meta: metaRepo(EMPTY_SYNC_META), staleAfterMs: HOUR });
    const queuedStates: boolean[] = [];
    c.subscribeQueued((q) => queuedStates.push(q));
    const stop = c.start();

    await c.requestSync('manual');
    expect(sync.syncAll).not.toHaveBeenCalled();
    expect(c.hasQueuedSync()).toBe(true);

    net.set(true);
    expect(sync.syncAll).toHaveBeenCalledWith('manual');
    expect(c.hasQueuedSync()).toBe(false);
    expect(queuedStates).toEqual([true, false]);
    stop();
  });

  it('reconnect with nothing queued triggers a staleness check', async () => {
    const net = fakeNetwork(false);
    const sync = fakeSync();
    const c = createSyncCoordinator({ sync, network: net.monitor, meta: metaRepo(EMPTY_SYNC_META), staleAfterMs: HOUR });
    c.start();
    net.set(true);
    await Promise.resolve();
    await Promise.resolve();
    expect(sync.syncAll).toHaveBeenCalledWith('reconnect');
  });
});
