import { create } from 'zustand';

import type { Breed, BreedGroup } from '@/domain';

/**
 * Normalised cache: entities keyed by id + ordered id lists. Selectors derive
 * views (sections, filtered lists) so a single breed update never re-renders
 * the whole list.
 */
export interface BreedState {
  breedsById: Record<string, Breed>;
  breedIds: string[];
  groupsById: Record<string, BreedGroup>;
  groupIds: string[];
  /** True once the SQLite cache has been read (even if empty) */
  hydrated: boolean;

  hydrate(breeds: readonly Breed[], groups: readonly BreedGroup[]): void;
  mergeBreeds(breeds: readonly Breed[]): void;
  mergeGroups(groups: readonly BreedGroup[]): void;
  upsertBreed(breed: Breed): void;
}

function indexBy<T extends { id: string }>(items: readonly T[], into: Record<string, T>) {
  for (const item of items) into[item.id] = item;
  return into;
}

function sortedIds(byId: Record<string, { name: string }>): string[] {
  return Object.keys(byId).sort((a, b) =>
    (byId[a]?.name ?? '').localeCompare(byId[b]?.name ?? '', undefined, { sensitivity: 'base' }),
  );
}

export const useBreedStore = create<BreedState>((set) => ({
  breedsById: {},
  breedIds: [],
  groupsById: {},
  groupIds: [],
  hydrated: false,

  hydrate: (breeds, groups) => {
    const breedsById = indexBy(breeds, {});
    const groupsById = indexBy(groups, {});
    set({
      breedsById,
      breedIds: sortedIds(breedsById),
      groupsById,
      groupIds: sortedIds(groupsById),
      hydrated: true,
    });
  },

  mergeBreeds: (breeds) =>
    set((state) => {
      if (breeds.length === 0) return state;
      const breedsById = indexBy(breeds, { ...state.breedsById });
      return { breedsById, breedIds: sortedIds(breedsById) };
    }),

  mergeGroups: (groups) =>
    set((state) => {
      if (groups.length === 0) return state;
      const groupsById = indexBy(groups, { ...state.groupsById });
      return { groupsById, groupIds: sortedIds(groupsById) };
    }),

  upsertBreed: (breed) =>
    set((state) => {
      const exists = breed.id in state.breedsById;
      const breedsById = { ...state.breedsById, [breed.id]: breed };
      return { breedsById, breedIds: exists ? state.breedIds : sortedIds(breedsById) };
    }),
}));
