import type { Breed, CoatLength, SizeBand, ThresholdTraitKey } from './types';

export type HypoallergenicFilter = 'any' | 'yes' | 'no';

export interface TraitThreshold {
  trait: ThresholdTraitKey;
  /** 1..5 inclusive — breeds scoring at or above are kept */
  min: number;
}

export interface BreedFilters {
  groupIds: string[];
  sizeBands: SizeBand[];
  coatLengths: CoatLength[];
  hypoallergenic: HypoallergenicFilter;
  /** null = no threshold applied */
  traitThreshold: TraitThreshold | null;
}

export const EMPTY_FILTERS: BreedFilters = {
  groupIds: [],
  sizeBands: [],
  coatLengths: [],
  hypoallergenic: 'any',
  traitThreshold: null,
};

export function countActiveFilters(filters: BreedFilters): number {
  return (
    filters.groupIds.length +
    filters.sizeBands.length +
    filters.coatLengths.length +
    (filters.hypoallergenic === 'any' ? 0 : 1) +
    (filters.traitThreshold ? 1 : 0)
  );
}

export function hasActiveFilters(filters: BreedFilters): boolean {
  return countActiveFilters(filters) > 0;
}

export function matchesFilters(breed: Breed, filters: BreedFilters): boolean {
  if (filters.groupIds.length > 0) {
    if (!breed.groupId || !filters.groupIds.includes(breed.groupId)) return false;
  }
  if (filters.sizeBands.length > 0 && !filters.sizeBands.includes(breed.sizeBand)) {
    return false;
  }
  if (filters.coatLengths.length > 0 && !filters.coatLengths.includes(breed.coat.length)) {
    return false;
  }
  if (filters.hypoallergenic === 'yes' && breed.hypoallergenic !== true) return false;
  if (filters.hypoallergenic === 'no' && breed.hypoallergenic !== false) return false;

  if (filters.traitThreshold) {
    const score = breed.traits[filters.traitThreshold.trait];
    if (score === null || score < filters.traitThreshold.min) return false;
  }
  return true;
}

/** Case-insensitive match on name or any other_names entry. */
export function matchesQuery(breed: Breed, normalisedQuery: string): boolean {
  if (normalisedQuery.length === 0) return true;
  return breed.searchText.includes(normalisedQuery);
}

export function normaliseQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function toggleInList<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}
