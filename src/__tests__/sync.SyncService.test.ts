import type { BreedPage, DogApi } from '@/data/api/dogApi';
import type { BreedRepository } from '@/data/db/repositories/BreedRepository';
import type { GroupRepository } from '@/data/db/repositories/GroupRepository';
import { EMPTY_SYNC_META, type SyncMeta, type SyncMetaRepository } from '@/data/db/repositories/SyncMetaRepository';
import { createSyncService, runWithConcurrency, type SyncEvent } from '@/data/sync/SyncService';
import type { Breed } from '@/domain';

import { fixtureBreeds, fixtureGroups } from './testUtils';

const TOTAL_PAGES = 6;

function breedForPage(page: number, i: number): Breed {
  const base = fixtureBreeds[i % fixtureBreeds.length]!;
  return { ...base, id: `p${page}-b${i}`, name: `${base.name} ${page}.${i}` };
}

function makePage(page: number, size = 3): BreedPage {
  return {
    breeds: Array.from({ length: size }, (_, i) => breedForPage(page, i)),
    pagination: { current: page, next: page < TOTAL_PAGES ? page + 1 : null, last: TOTAL_PAGES, records: 283 },
  };
}

function createFakes(failPages: number[] = []) {
  const stored = new Map<string, Breed>();
  let meta: SyncMeta = EMPTY_SYNC_META;
  const fetched: number[] = [];

  const api: DogApi = {
    fetchBreedPage: jest.fn((page: number) => {
      fetched.push(page);
      if (failPages.includes(page)) return Promise.reject(new Error(`boom ${page}`));
      return Promise.resolve(makePage(page));
    }),
    fetchBreed: jest.fn((id: string) => Promise.resolve({ ...fixtureBreeds[0]!, id, name: 'Refreshed' })),
    fetchGroups: jest.fn(() => Promise.resolve(fixtureGroups)),
  };
  const breeds: BreedRepository = {
    getAll: async () => [...stored.values()],
    getById: async (id) => stored.get(id) ?? null,
    count: async () => stored.size,
    upsertMany: jest.fn(async (list: readonly Breed[]) => {
      for (const b of list) stored.set(b.id, b);
    }),
    upsert: jest.fn(async (b: Breed) => {
      stored.set(b.id, b);
    }),
    clear: async () => stored.clear(),
  };
  const groups: GroupRepository = { getAll: async () => [], upsertMany: jest.fn(async () => undefined) };
  const metaRepo: SyncMetaRepository = {
    get: async () => meta,
    set: async (m) => {
      meta = m;
    },
  };
  return { api, breeds, groups, metaRepo, stored, fetched, getMeta: () => meta };
}

describe('runWithConcurrency', () => {
  it('never exceeds the limit and preserves result order', async () => {
    let active = 0;
    let peak = 0;
    const tasks = Array.from({ length: 8 }, (_, i) => async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 5));
      active -= 1;
      return i;
    });
    const results = await runWithConcurrency(tasks, 3);
    expect(peak).toBeLessThanOrEqual(3);
    expect(results.map((r) => (r.status === 'fulfilled' ? r.value : -1))).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });
});

describe('SyncService.syncAll', () => {
  it('learns the page count from page 1, merges all 6 pages and records fresh meta', async () => {
    const f = createFakes();
    const service = createSyncService({ api: f.api, breeds: f.breeds, groups: f.groups, meta: f.metaRepo, now: () => 1000 });
    const events: SyncEvent[] = [];
    service.subscribe((e) => events.push(e));

    const result = await service.syncAll('initial');

    expect(result.complete).toBe(true);
    expect(result.totalPages).toBe(6);
    expect(result.mergedBreeds).toBe(18);
    expect(f.stored.size).toBe(18);
    expect([...f.fetched].sort()).toEqual([1, 2, 3, 4, 5, 6]);
    expect(f.getMeta()).toEqual({
      lastSyncedAt: 1000,
      lastAttemptAt: 1000,
      totalPages: 6,
      failedPages: [],
      totalRecords: 283,
    });
    expect(events[0]).toEqual({ type: 'started', reason: 'initial' });
    expect(events.filter((e) => e.type === 'page')).toHaveLength(6);
    expect(events.some((e) => e.type === 'groups')).toBe(true);
    expect(events.at(-1)?.type).toBe('finished');
    expect(f.groups.upsertMany).toHaveBeenCalled();
  });

  it('keeps merged pages and records failed ones on partial failure', async () => {
    const f = createFakes([5]);
    const service = createSyncService({ api: f.api, breeds: f.breeds, groups: f.groups, meta: f.metaRepo, now: () => 2000 });
    const events: SyncEvent[] = [];
    service.subscribe((e) => events.push(e));

    const result = await service.syncAll('manual');

    expect(result.succeeded).toBe(true);
    expect(result.complete).toBe(false);
    expect(result.failedPages).toEqual([5]);
    expect(result.mergedBreeds).toBe(15);
    expect(f.getMeta().lastSyncedAt).toBe(2000);
    expect(events.find((e) => e.type === 'page-failed')).toMatchObject({ page: 5, error: 'boom 5' });
    const finished = events.at(-1);
    expect(finished?.type === 'finished' && finished.result.error).toBeNull();
  });

  it('when page 1 fails it still fans out using the previously known page count', async () => {
    const f = createFakes([1]);
    await f.metaRepo.set({ ...EMPTY_SYNC_META, totalPages: 6, lastSyncedAt: 5 });
    const service = createSyncService({ api: f.api, breeds: f.breeds, groups: f.groups, meta: f.metaRepo });
    const result = await service.syncAll('stale');
    expect(result.failedPages).toEqual([1]);
    expect(result.mergedBreeds).toBe(15);
  });

  it('reports total failure without touching lastSyncedAt', async () => {
    const f = createFakes([1, 2, 3, 4, 5, 6]);
    await f.metaRepo.set({ ...EMPTY_SYNC_META, totalPages: 6, lastSyncedAt: 42 });
    const service = createSyncService({ api: f.api, breeds: f.breeds, groups: f.groups, meta: f.metaRepo, now: () => 99 });
    const result = await service.syncAll('reconnect');
    expect(result.succeeded).toBe(false);
    expect(result.error).toBeTruthy();
    expect(f.getMeta().lastSyncedAt).toBe(42);
    expect(f.getMeta().lastAttemptAt).toBe(99);
  });

  it('coalesces concurrent calls into one run', async () => {
    const f = createFakes();
    const service = createSyncService({ api: f.api, breeds: f.breeds, groups: f.groups, meta: f.metaRepo });
    const [a, b] = await Promise.all([service.syncAll('manual'), service.syncAll('stale')]);
    expect(a).toBe(b);
    expect(f.api.fetchBreedPage).toHaveBeenCalledTimes(6);
  });
});

describe('SyncService.retryFailedPages', () => {
  it('re-fetches only the failed pages and clears them on success', async () => {
    const f = createFakes([3, 5]);
    const service = createSyncService({ api: f.api, breeds: f.breeds, groups: f.groups, meta: f.metaRepo });
    await service.syncAll('initial');
    expect(f.getMeta().failedPages).toEqual([3, 5]);

    f.fetched.splice(0);
    (f.api.fetchBreedPage as jest.Mock).mockImplementation((page: number) => {
      f.fetched.push(page);
      return Promise.resolve(makePage(page));
    });
    const result = await service.retryFailedPages();

    expect([...f.fetched].sort()).toEqual([3, 5]);
    expect(result.failedPages).toEqual([]);
    expect(result.complete).toBe(true);
    expect(f.stored.size).toBe(18);
  });

  it('carries forward pages that were not part of the retry and still fail', async () => {
    const f = createFakes([3, 5]);
    const service = createSyncService({ api: f.api, breeds: f.breeds, groups: f.groups, meta: f.metaRepo });
    await service.syncAll('initial');
    const result = await service.retryFailedPages(); // 3 and 5 fail again
    expect(result.failedPages).toEqual([3, 5]);
  });
});

describe('SyncService.refreshBreed', () => {
  it('fetches one breed, persists it and emits breed-refreshed', async () => {
    const f = createFakes();
    const service = createSyncService({ api: f.api, breeds: f.breeds, groups: f.groups, meta: f.metaRepo });
    const events: SyncEvent[] = [];
    service.subscribe((e) => events.push(e));
    const breed = await service.refreshBreed('abc');
    expect(breed.id).toBe('abc');
    expect(f.stored.get('abc')?.name).toBe('Refreshed');
    expect(events).toEqual([{ type: 'breed-refreshed', breed }]);
  });
});
