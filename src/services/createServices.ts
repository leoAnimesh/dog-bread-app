import { env, type Env } from '@/config/env';
import { createDogApi, type DogApi } from '@/data/api/dogApi';
import { createHttpClient } from '@/data/api/httpClient';
import { openDatabase, type Database } from '@/data/db/database';
import { createBreedRepository, type BreedRepository } from '@/data/db/repositories/BreedRepository';
import { createGroupRepository, type GroupRepository } from '@/data/db/repositories/GroupRepository';
import {
  createImageCacheRepository,
  type ImageCacheRepository,
} from '@/data/db/repositories/ImageCacheRepository';
import {
  createSyncMetaRepository,
  type SyncMetaRepository,
} from '@/data/db/repositories/SyncMetaRepository';
import { createImageCacheService, type ImageCacheService } from '@/data/images/ImageCacheService';
import { createNetInfoMonitor, type NetworkMonitor } from '@/data/sync/NetworkMonitor';
import { createSyncCoordinator, type SyncCoordinator } from '@/data/sync/SyncCoordinator';
import { createSyncService, type SyncService } from '@/data/sync/SyncService';

/**
 * Composition root. Everything downstream depends on these interfaces, not on
 * expo-sqlite / fetch / NetInfo directly, which keeps the hooks testable.
 */
export interface Services {
  env: Env;
  db: Database;
  api: DogApi;
  breedRepo: BreedRepository;
  groupRepo: GroupRepository;
  syncMetaRepo: SyncMetaRepository;
  imageCacheRepo: ImageCacheRepository;
  sync: SyncService;
  coordinator: SyncCoordinator;
  network: NetworkMonitor;
  images: ImageCacheService;
}

export async function createServices(overrides: Partial<Services> = {}): Promise<Services> {
  const db = overrides.db ?? (await openDatabase());
  const http = createHttpClient({ baseUrl: env.apiBaseUrl });
  const api = overrides.api ?? createDogApi(http, env.apiPageSize);

  const breedRepo = overrides.breedRepo ?? createBreedRepository(db);
  const groupRepo = overrides.groupRepo ?? createGroupRepository(db);
  const syncMetaRepo = overrides.syncMetaRepo ?? createSyncMetaRepository(db);
  const imageCacheRepo = overrides.imageCacheRepo ?? createImageCacheRepository(db);

  const network = overrides.network ?? createNetInfoMonitor();
  const sync =
    overrides.sync ??
    createSyncService({ api, breeds: breedRepo, groups: groupRepo, meta: syncMetaRepo });
  const coordinator =
    overrides.coordinator ??
    createSyncCoordinator({ sync, network, meta: syncMetaRepo, staleAfterMs: env.staleAfterMs });
  const images =
    overrides.images ??
    createImageCacheService({ repo: imageCacheRepo, limitBytes: env.imageCacheLimitBytes });

  return {
    env,
    db,
    api,
    breedRepo,
    groupRepo,
    syncMetaRepo,
    imageCacheRepo,
    sync,
    coordinator,
    network,
    images,
  };
}
