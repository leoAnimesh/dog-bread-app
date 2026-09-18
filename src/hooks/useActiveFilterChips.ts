import { useMemo } from 'react';

import {
  COAT_LENGTH_LABELS,
  SIZE_BAND_LABELS,
  THRESHOLD_TRAIT_SHORT_LABELS,
} from '@/domain/labels';
import { useBreedStore } from '@/store/useBreedStore';
import { useFilterStore } from '@/store/useFilterStore';

export interface ActiveFilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

/** The removable chips shown next to the "Filters" button on the list. */
export function useActiveFilterChips(): ActiveFilterChip[] {
  const filters = useFilterStore((s) => s.filters);
  const groupsById = useBreedStore((s) => s.groupsById);
  const removeGroup = useFilterStore((s) => s.removeGroup);
  const removeSizeBand = useFilterStore((s) => s.removeSizeBand);
  const removeCoatLength = useFilterStore((s) => s.removeCoatLength);
  const clearHypoallergenic = useFilterStore((s) => s.clearHypoallergenic);
  const clearTraitThreshold = useFilterStore((s) => s.clearTraitThreshold);

  return useMemo(() => {
    const chips: ActiveFilterChip[] = [];
    for (const id of filters.groupIds) {
      chips.push({ key: `g:${id}`, label: groupsById[id]?.label ?? 'Group', onRemove: () => removeGroup(id) });
    }
    for (const band of filters.sizeBands) {
      chips.push({ key: `s:${band}`, label: SIZE_BAND_LABELS[band], onRemove: () => removeSizeBand(band) });
    }
    for (const coat of filters.coatLengths) {
      chips.push({ key: `c:${coat}`, label: COAT_LENGTH_LABELS[coat], onRemove: () => removeCoatLength(coat) });
    }
    if (filters.hypoallergenic !== 'any') {
      chips.push({
        key: 'hypo',
        label: filters.hypoallergenic === 'yes' ? 'Hypoallergenic' : 'Not hypoallergenic',
        onRemove: clearHypoallergenic,
      });
    }
    if (filters.traitThreshold) {
      const { trait, min } = filters.traitThreshold;
      chips.push({
        key: 'trait',
        label: `${THRESHOLD_TRAIT_SHORT_LABELS[trait]} ${min}+`,
        onRemove: clearTraitThreshold,
      });
    }
    return chips;
  }, [filters, groupsById, removeGroup, removeSizeBand, removeCoatLength, clearHypoallergenic, clearTraitThreshold]);
}
