import { useEffect, useRef, useState } from 'react';

import type { Breed, BreedGroup } from '@/domain';
import { useServices } from '@/services/ServicesProvider';
import { useBreedStore } from '@/store/useBreedStore';
import { useSyncStore } from '@/store/useSyncStore';
import { errorMessage } from '@/utils/guards';

export interface BreedDetailView {
  breed: Breed | null;
  group: BreedGroup | null;
  /** Epoch ms of the last successful GET /breeds/:id in this session */
  refreshedAt: number | null;
  refreshing: boolean;
  refreshError: string | null;
  isOnline: boolean;
}

interface RefreshOutcome {
  id: string;
  refreshedAt: number | null;
  error: string | null;
}

/**
 * Cache-first detail: the row from the list store renders instantly, then a
 * single-breed refresh runs in the background when online.
 */
export function useBreedDetail(id: string): BreedDetailView {
  const { sync } = useServices();
  const breed = useBreedStore((s) => s.breedsById[id] ?? null);
  const group = useBreedStore((s) =>
    breed?.groupId ? (s.groupsById[breed.groupId] ?? null) : null,
  );
  const isOnline = useSyncStore((s) => s.isOnline);

  const [outcome, setOutcome] = useState<RefreshOutcome | null>(null);
  const attempted = useRef<string | null>(null);

  useEffect(() => {
    if (!isOnline || attempted.current === id) return;
    attempted.current = id;
    let cancelled = false;
    sync
      .refreshBreed(id)
      .then(() => {
        if (!cancelled) setOutcome({ id, refreshedAt: Date.now(), error: null });
      })
      .catch((e: unknown) => {
        if (!cancelled) setOutcome({ id, refreshedAt: null, error: errorMessage(e) });
      });
    return () => {
      cancelled = true;
      // Allow a retry if the effect is torn down before the request settles.
      if (attempted.current === id) attempted.current = null;
    };
  }, [id, isOnline, sync]);

  const current = outcome?.id === id ? outcome : null;
  return {
    breed,
    group,
    refreshedAt: current?.refreshedAt ?? null,
    refreshing: isOnline && current === null,
    refreshError: current?.error ?? null,
    isOnline,
  };
}
