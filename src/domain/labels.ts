import type { Breed, CoatLength, SizeBand, ThresholdTraitKey, TraitKey } from './types';

export const SIZE_BAND_LABELS: Record<SizeBand, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
  giant: 'Giant',
  unknown: 'Unknown size',
};

export const SIZE_BAND_FILTER_LABELS: Record<Exclude<SizeBand, 'unknown'>, string> = {
  small: 'Small · ≤10 kg',
  medium: 'Medium · 10–25 kg',
  large: 'Large · 25–45 kg',
  giant: 'Giant · 45 kg+',
};

export const COAT_LENGTH_LABELS: Record<CoatLength, string> = {
  short: 'Short',
  medium: 'Medium',
  long: 'Long',
  wire: 'Wire',
  hairless: 'Hairless',
  unknown: 'Unknown coat',
};

export const FILTERABLE_SIZE_BANDS: Exclude<SizeBand, 'unknown'>[] = [
  'small',
  'medium',
  'large',
  'giant',
];

export const FILTERABLE_COAT_LENGTHS: Exclude<CoatLength, 'unknown' | 'hairless'>[] = [
  'short',
  'medium',
  'long',
  'wire',
];

export const THRESHOLD_TRAIT_LABELS: Record<ThresholdTraitKey, string> = {
  good_with_children: 'Good with children',
  good_with_dogs: 'With dogs',
  good_with_strangers: 'With strangers',
};

export const THRESHOLD_TRAIT_SHORT_LABELS: Record<ThresholdTraitKey, string> = {
  good_with_children: 'Kids',
  good_with_dogs: 'Dogs',
  good_with_strangers: 'Strangers',
};

export const TRAIT_LABELS: Record<TraitKey, string> = {
  energy: 'Energy',
  barking: 'Barking',
  drooling: 'Drooling',
  grooming: 'Grooming',
  shedding: 'Shedding',
  trainability: 'Trainability',
  good_with_dogs: 'Good with dogs',
  exercise_minutes: 'Exercise',
  apartment_friendly: 'Apartment friendly',
  good_with_children: 'Good with children',
  good_with_strangers: 'Good with strangers',
};

/** Traits the design groups under "Daily life & care" (rust scale). */
export const CARE_TRAIT_KEYS: TraitKey[] = [
  'energy',
  'exercise_minutes',
  'trainability',
  'barking',
  'grooming',
  'shedding',
  'drooling',
  'apartment_friendly',
];

/** Traits the design groups under "Sociability" (sage scale). */
export const SOCIAL_TRAIT_KEYS: TraitKey[] = [
  'good_with_children',
  'good_with_dogs',
  'good_with_strangers',
];

export function formatRange(range: { min: number | null; max: number | null }, unit: string): string {
  if (range.min === null && range.max === null) return '—';
  if (range.min !== null && range.max !== null) {
    return range.min === range.max ? `${range.min} ${unit}` : `${range.min}–${range.max} ${unit}`;
  }
  return `${range.min ?? range.max} ${unit}`;
}

/** "Medium · Short coat · 12–16 yrs" — the meta line on each list row. */
export function breedMetaLine(breed: Breed): string {
  const parts: string[] = [];
  if (breed.sizeBand !== 'unknown') parts.push(SIZE_BAND_LABELS[breed.sizeBand]);
  if (breed.coat.length !== 'unknown') parts.push(`${COAT_LENGTH_LABELS[breed.coat.length]} coat`);
  if (breed.life.min !== null || breed.life.max !== null) {
    parts.push(formatRange(breed.life, 'yrs'));
  }
  return parts.join(' · ');
}

export function otherNamesLine(names: readonly string[], max = 2): string {
  return names
    .slice(0, max)
    .map((n) => n.toUpperCase())
    .join(' · ');
}
