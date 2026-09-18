import { useCallback, useMemo, useState } from 'react';

import {
  countActiveFilters,
  EMPTY_FILTERS,
  matchesFilters,
  toggleInList,
  type Breed,
  type BreedFilters,
  type CoatLength,
  type HypoallergenicFilter,
  type SizeBand,
  type ThresholdTraitKey,
} from '@/domain';
import { useBreedStore } from '@/store/useBreedStore';
import { useFilterStore } from '@/store/useFilterStore';

const DEFAULT_TRAIT: ThresholdTraitKey = 'good_with_children';
const DEFAULT_MIN = 3;

/**
 * Filters screen edits a *draft* so nothing changes on the list until "Apply".
 * The draft also previews how many breeds would match.
 */
export function useFilterDraft() {
  const applied = useFilterStore((s) => s.filters);
  const applyFilters = useFilterStore((s) => s.applyFilters);
  const breedsById = useBreedStore((s) => s.breedsById);
  const groupsById = useBreedStore((s) => s.groupsById);
  const groupIds = useBreedStore((s) => s.groupIds);

  const [draft, setDraft] = useState<BreedFilters>(applied);

  const groups = useMemo(
    () =>
      groupIds
        .map((id) => groupsById[id])
        .filter((g): g is NonNullable<typeof g> => g !== undefined)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [groupIds, groupsById],
  );

  const matchCount = useMemo(() => {
    let n = 0;
    for (const id in breedsById) {
      const breed: Breed | undefined = breedsById[id];
      if (breed && matchesFilters(breed, draft)) n += 1;
    }
    return n;
  }, [breedsById, draft]);

  const toggleGroup = useCallback(
    (id: string) => setDraft((d) => ({ ...d, groupIds: toggleInList(d.groupIds, id) })),
    [],
  );
  const toggleSizeBand = useCallback(
    (band: SizeBand) => setDraft((d) => ({ ...d, sizeBands: toggleInList(d.sizeBands, band) })),
    [],
  );
  const toggleCoatLength = useCallback(
    (length: CoatLength) =>
      setDraft((d) => ({ ...d, coatLengths: toggleInList(d.coatLengths, length) })),
    [],
  );
  const setHypoallergenic = useCallback(
    (value: HypoallergenicFilter) => setDraft((d) => ({ ...d, hypoallergenic: value })),
    [],
  );
  const setTrait = useCallback(
    (trait: ThresholdTraitKey) =>
      setDraft((d) => ({
        ...d,
        traitThreshold: { trait, min: d.traitThreshold?.min ?? DEFAULT_MIN },
      })),
    [],
  );
  const setMinScore = useCallback(
    (min: number) =>
      setDraft((d) => ({
        ...d,
        traitThreshold: { trait: d.traitThreshold?.trait ?? DEFAULT_TRAIT, min },
      })),
    [],
  );
  const clearTrait = useCallback(() => setDraft((d) => ({ ...d, traitThreshold: null })), []);
  const reset = useCallback(() => setDraft(EMPTY_FILTERS), []);
  const apply = useCallback(() => applyFilters(draft), [applyFilters, draft]);

  return {
    draft,
    groups,
    matchCount,
    activeCount: countActiveFilters(draft),
    selectedTrait: draft.traitThreshold?.trait ?? DEFAULT_TRAIT,
    minScore: draft.traitThreshold?.min ?? DEFAULT_MIN,
    traitEnabled: draft.traitThreshold !== null,
    toggleGroup,
    toggleSizeBand,
    toggleCoatLength,
    setHypoallergenic,
    setTrait,
    setMinScore,
    clearTrait,
    reset,
    apply,
  };
}
