import { create } from 'zustand';

import { EMPTY_FILTERS, type BreedFilters } from '@/domain/filters';

export interface FilterState {
  /** Raw text as typed; debounced downstream in useBreedList */
  query: string;
  filters: BreedFilters;

  setQuery(query: string): void;
  applyFilters(filters: BreedFilters): void;
  clearFilters(): void;
  removeGroup(groupId: string): void;
  removeSizeBand(band: BreedFilters['sizeBands'][number]): void;
  removeCoatLength(length: BreedFilters['coatLengths'][number]): void;
  clearHypoallergenic(): void;
  clearTraitThreshold(): void;
}

export const useFilterStore = create<FilterState>((set) => ({
  query: '',
  filters: EMPTY_FILTERS,

  setQuery: (query) => set({ query }),
  applyFilters: (filters) => set({ filters }),
  clearFilters: () => set({ filters: EMPTY_FILTERS }),
  removeGroup: (groupId) =>
    set((s) => ({ filters: { ...s.filters, groupIds: s.filters.groupIds.filter((g) => g !== groupId) } })),
  removeSizeBand: (band) =>
    set((s) => ({ filters: { ...s.filters, sizeBands: s.filters.sizeBands.filter((b) => b !== band) } })),
  removeCoatLength: (length) =>
    set((s) => ({
      filters: { ...s.filters, coatLengths: s.filters.coatLengths.filter((c) => c !== length) },
    })),
  clearHypoallergenic: () => set((s) => ({ filters: { ...s.filters, hypoallergenic: 'any' } })),
  clearTraitThreshold: () => set((s) => ({ filters: { ...s.filters, traitThreshold: null } })),
}));
