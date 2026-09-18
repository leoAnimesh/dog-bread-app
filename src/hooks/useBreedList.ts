import { useMemo } from 'react';

import { env } from '@/config/env';
import {
  countActiveFilters,
  matchesFilters,
  matchesQuery,
  normaliseQuery,
  type Breed,
  type BreedGroup,
} from '@/domain';
import { useBreedStore } from '@/store/useBreedStore';
import { useFilterStore } from '@/store/useFilterStore';

import { useDebouncedValue } from './useDebouncedValue';

/**
 * Flattened, virtualisation-friendly list. Section headers are items too so
 * FlashList can recycle them by type instead of nesting lists.
 */
export type BreedListItem =
  | { kind: 'header'; key: string; group: BreedGroup | null; label: string; count: number }
  | { kind: 'row'; key: string; breed: Breed };

export interface BreedListView {
  items: BreedListItem[];
  totalCount: number;
  matchCount: number;
  groupCount: number;
  activeFilterCount: number;
  isFiltering: boolean;
  hydrated: boolean;
  isEmptyCache: boolean;
}

const UNGROUPED: BreedGroup = { id: '__ungrouped', name: 'Other', label: 'Other', breedIds: [] };

export function buildSections(
  breeds: readonly Breed[],
  groupsById: Record<string, BreedGroup>,
  groupIds: readonly string[],
): BreedListItem[] {
  const buckets = new Map<string, Breed[]>();
  for (const breed of breeds) {
    const key = breed.groupId && groupsById[breed.groupId] ? breed.groupId : UNGROUPED.id;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(breed);
    else buckets.set(key, [breed]);
  }

  const orderedGroupIds = [...groupIds].sort((a, b) =>
    (groupsById[a]?.label ?? '').localeCompare(groupsById[b]?.label ?? ''),
  );
  if (buckets.has(UNGROUPED.id)) orderedGroupIds.push(UNGROUPED.id);

  const items: BreedListItem[] = [];
  for (const groupId of orderedGroupIds) {
    const bucket = buckets.get(groupId);
    if (!bucket || bucket.length === 0) continue;
    const group = groupId === UNGROUPED.id ? UNGROUPED : (groupsById[groupId] ?? UNGROUPED);
    items.push({
      kind: 'header',
      key: `h:${groupId}`,
      group,
      label: group.label.toUpperCase(),
      count: bucket.length,
    });
    for (const breed of bucket) items.push({ kind: 'row', key: breed.id, breed });
  }
  return items;
}

export function useBreedList(): BreedListView {
  const breedsById = useBreedStore((s) => s.breedsById);
  const breedIds = useBreedStore((s) => s.breedIds);
  const groupsById = useBreedStore((s) => s.groupsById);
  const groupIds = useBreedStore((s) => s.groupIds);
  const hydrated = useBreedStore((s) => s.hydrated);
  const query = useFilterStore((s) => s.query);
  const filters = useFilterStore((s) => s.filters);

  const debouncedQuery = useDebouncedValue(query, env.searchDebounceMs);
  const normalisedQuery = useMemo(() => normaliseQuery(debouncedQuery), [debouncedQuery]);

  const allBreeds = useMemo(
    () => breedIds.map((id) => breedsById[id]).filter((b): b is Breed => b !== undefined),
    [breedIds, breedsById],
  );

  const filtered = useMemo(
    () => allBreeds.filter((b) => matchesQuery(b, normalisedQuery) && matchesFilters(b, filters)),
    [allBreeds, normalisedQuery, filters],
  );

  const items = useMemo(
    () => buildSections(filtered, groupsById, groupIds),
    [filtered, groupsById, groupIds],
  );

  const activeFilterCount = countActiveFilters(filters);

  return {
    items,
    totalCount: allBreeds.length,
    matchCount: filtered.length,
    groupCount: groupIds.length,
    activeFilterCount,
    isFiltering: activeFilterCount > 0 || normalisedQuery.length > 0,
    hydrated,
    isEmptyCache: hydrated && allBreeds.length === 0,
  };
}
