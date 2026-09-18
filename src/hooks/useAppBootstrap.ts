import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
} from '@expo-google-fonts/ibm-plex-mono';
import {
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
} from '@expo-google-fonts/instrument-serif';
import {
  Karla_400Regular,
  Karla_500Medium,
  Karla_600SemiBold,
  Karla_700Bold,
} from '@expo-google-fonts/karla';
import { useFonts } from 'expo-font';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import type { SyncEvent } from '@/data/sync/SyncService';
import { createServices, type Services } from '@/services/createServices';
import { useBreedStore } from '@/store/useBreedStore';
import { useSyncStore } from '@/store/useSyncStore';
import { errorMessage } from '@/utils/guards';

export interface BootstrapState {
  ready: boolean;
  services: Services | null;
  error: string | null;
}

/** Routes SyncService events into the Zustand stores. */
function bindSyncEvents(services: Services): () => void {
  const breeds = useBreedStore.getState();
  const sync = useSyncStore.getState();

  const unsubscribeSync = services.sync.subscribe((event: SyncEvent) => {
    switch (event.type) {
      case 'started':
        sync.syncStarted();
        break;
      case 'groups':
        breeds.mergeGroups(event.groups);
        break;
      case 'page':
        breeds.mergeBreeds(event.breeds);
        sync.syncProgress(event.progress);
        break;
      case 'page-failed':
        sync.syncProgress(event.progress);
        break;
      case 'finished':
        sync.syncFinished(event.result.meta, event.result.error);
        break;
      case 'breed-refreshed':
        breeds.upsertBreed(event.breed);
        break;
    }
  });

  const unsubscribeNetwork = services.network.subscribe((online) => sync.setOnline(online));
  const unsubscribeQueue = services.coordinator.subscribeQueued((queued) => sync.setQueued(queued));
  const stopCoordinator = services.coordinator.start();

  const appState = AppState.addEventListener('change', (state) => {
    if (state === 'active') void services.coordinator.syncIfNeeded('stale');
  });

  return () => {
    unsubscribeSync();
    unsubscribeNetwork();
    unsubscribeQueue();
    stopCoordinator();
    appState.remove();
  };
}

/**
 * Cold start path, optimised for "<3s to interactive with cached data":
 *  1. open SQLite + read cached breeds/groups/meta into the store (fast, local)
 *  2. mark ready — the list renders from cache immediately
 *  3. kick a background sync only if the cache is stale or incomplete
 */
export function useAppBootstrap(): BootstrapState {
  const [fontsLoaded, fontError] = useFonts({
    Karla_400Regular,
    Karla_500Medium,
    Karla_600SemiBold,
    Karla_700Bold,
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });
  const [services, setServices] = useState<Services | null>(null);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const svc = await createServices();
        const [breeds, groups, meta] = await Promise.all([
          svc.breedRepo.getAll(),
          svc.groupRepo.getAll(),
          svc.syncMetaRepo.get(),
        ]);
        useBreedStore.getState().hydrate(breeds, groups);
        useSyncStore.getState().setMeta(meta);
        useSyncStore.getState().setOnline(svc.network.isOnline());
        cleanup = bindSyncEvents(svc);
        setServices(svc);

        // Off the critical path: image index + network probe + background sync.
        void svc.images.hydrate();
        void svc.network.refresh().then(() => svc.coordinator.syncIfNeeded(meta.lastSyncedAt ? 'stale' : 'initial'));
      } catch (e) {
        setError(errorMessage(e));
      }
    })();

    return () => cleanup?.();
  }, []);

  return {
    ready: (fontsLoaded || fontError !== null) && services !== null,
    services,
    error: error ?? (fontError ? fontError.message : null),
  };
}
