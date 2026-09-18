import type { DogApi } from '@/data/api/dogApi';
import type { BreedRepository } from '@/data/db/repositories/BreedRepository';
import type { GroupRepository } from '@/data/db/repositories/GroupRepository';
import type { SyncMeta, SyncMetaRepository } from '@/data/db/repositories/SyncMetaRepository';
import type { Breed, BreedGroup } from '@/domain';
import { errorMessage } from '@/utils/guards';

export type SyncReason = 'initial' | 'stale' | 'manual' | 'reconnect' | 'retry';

export interface SyncProgress {
  /** Pages that have been merged into the cache so far (successful or failed) */
  completedPages: number;
  totalPages: number;
  /** Page numbers that have failed so far in this run */
  failedPages: number[];
}

export type SyncEvent =
  | { type: 'started'; reason: SyncReason }
  | { type: 'groups'; groups: BreedGroup[] }
  | { type: 'page'; page: number; breeds: Breed[]; progress: SyncProgress }
  | { type: 'page-failed'; page: number; error: string; progress: SyncProgress }
  | { type: 'finished'; result: SyncResult }
  | { type: 'breed-refreshed'; breed: Breed };

export interface SyncResult {
  reason: SyncReason;
  totalPages: number;
  failedPages: number[];
  mergedBreeds: number;
  /** True when at least one page merged (possibly partial) */
  succeeded: boolean;
  /** True when *every* page merged */
  complete: boolean;
  meta: SyncMeta;
  error: string | null;
}

export type SyncListener = (event: SyncEvent) => void;

export interface SyncServiceDeps {
  api: DogApi;
  breeds: BreedRepository;
  groups: GroupRepository;
  meta: SyncMetaRepository;
  now?: () => number;
  /** Max simultaneous page requests while assembling the dataset */
  concurrency?: number;
}

export interface SyncService {
  /** Full sync: groups + every breed page. Coalesces concurrent calls. */
  syncAll(reason: SyncReason): Promise<SyncResult>;
  /** Re-fetch only pages recorded as failed in the last run. */
  retryFailedPages(): Promise<SyncResult>;
  /** GET /breeds/:id — enrich a single breed and persist it. */
  refreshBreed(id: string): Promise<Breed>;
  subscribe(listener: SyncListener): () => void;
  isRunning(): boolean;
}

/**
 * Runs `tasks` with at most `limit` in flight. Order of completion is not
 * guaranteed, which is fine because each page is upserted independently.
 */
export async function runWithConcurrency<T>(
  tasks: readonly (() => Promise<T>)[],
  limit: number,
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(tasks.length);
  let cursor = 0;

  async function worker(): Promise<void> {
    while (cursor < tasks.length) {
      const index = cursor;
      cursor += 1;
      const task = tasks[index];
      if (!task) continue;
      try {
        results[index] = { status: 'fulfilled', value: await task() };
      } catch (reason) {
        results[index] = { status: 'rejected', reason };
      }
    }
  }

  const workers = Array.from({ length: Math.max(1, Math.min(limit, tasks.length)) }, worker);
  await Promise.all(workers);
  return results;
}

export function createSyncService(deps: SyncServiceDeps): SyncService {
  const now = deps.now ?? (() => Date.now());
  const concurrency = deps.concurrency ?? 3;
  const listeners = new Set<SyncListener>();
  let inFlight: Promise<SyncResult> | null = null;

  const emit = (event: SyncEvent) => {
    for (const listener of listeners) listener(event);
  };

  async function syncPages(
    reason: SyncReason,
    pagesToFetch: number[] | null,
  ): Promise<SyncResult> {
    emit({ type: 'started', reason });
    const previous = await deps.meta.get();
    const startedAt = now();
    let mergedBreeds = 0;
    let totalPages = previous.totalPages || 1;
    let totalRecords = previous.totalRecords;
    const failedPages = new Set<number>();
    let completedPages = 0;

    const progress = (): SyncProgress => ({
      completedPages,
      totalPages,
      failedPages: [...failedPages].sort((a, b) => a - b),
    });

    const mergePage = async (page: number, breeds: Breed[]) => {
      await deps.breeds.upsertMany(breeds, page, now());
      mergedBreeds += breeds.length;
      completedPages += 1;
      emit({ type: 'page', page, breeds, progress: progress() });
    };

    const failPage = (page: number, error: unknown) => {
      failedPages.add(page);
      completedPages += 1;
      emit({ type: 'page-failed', page, error: errorMessage(error), progress: progress() });
    };

    // Groups are tiny and independent — never let them block the breed pages.
    const groupsPromise = deps.api
      .fetchGroups()
      .then(async (groups) => {
        await deps.groups.upsertMany(groups, now());
        emit({ type: 'groups', groups });
      })
      .catch(() => undefined);

    let remaining: number[];
    if (pagesToFetch === null) {
      // Page 1 tells us how many pages exist; only then fan out.
      try {
        const first = await deps.api.fetchBreedPage(1);
        totalPages = Math.max(1, first.pagination.last);
        totalRecords = first.pagination.records;
        await mergePage(1, first.breeds);
      } catch (error) {
        failPage(1, error);
      }
      remaining = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
    } else {
      remaining = pagesToFetch;
    }

    await runWithConcurrency(
      remaining.map((page) => async () => {
        try {
          const result = await deps.api.fetchBreedPage(page);
          await mergePage(page, result.breeds);
        } catch (error) {
          failPage(page, error);
        }
      }),
      concurrency,
    );
    await groupsPromise;

    const failed = [...failedPages].sort((a, b) => a - b);
    // When retrying, pages not in this run keep their previous status.
    const carriedFailures =
      pagesToFetch === null
        ? []
        : previous.failedPages.filter((p) => !pagesToFetch.includes(p));
    const allFailed = [...new Set([...failed, ...carriedFailures])].sort((a, b) => a - b);
    const succeeded = mergedBreeds > 0;

    const meta: SyncMeta = {
      lastSyncedAt: succeeded ? startedAt : previous.lastSyncedAt,
      lastAttemptAt: startedAt,
      totalPages,
      failedPages: allFailed,
      totalRecords,
    };
    await deps.meta.set(meta);

    const result: SyncResult = {
      reason,
      totalPages,
      failedPages: allFailed,
      mergedBreeds,
      succeeded,
      complete: allFailed.length === 0 && succeeded,
      meta,
      error: succeeded ? null : 'Could not reach the breed service',
    };
    emit({ type: 'finished', result });
    return result;
  }

  function coalesce(run: () => Promise<SyncResult>): Promise<SyncResult> {
    if (inFlight) return inFlight;
    inFlight = run().finally(() => {
      inFlight = null;
    });
    return inFlight;
  }

  return {
    syncAll: (reason) => coalesce(() => syncPages(reason, null)),

    retryFailedPages: () =>
      coalesce(async () => {
        const meta = await deps.meta.get();
        if (meta.failedPages.length === 0) return syncPages('retry', null);
        return syncPages('retry', meta.failedPages);
      }),

    async refreshBreed(id) {
      const breed = await deps.api.fetchBreed(id);
      await deps.breeds.upsert(breed, now());
      emit({ type: 'breed-refreshed', breed });
      return breed;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    isRunning: () => inFlight !== null,
  };
}
