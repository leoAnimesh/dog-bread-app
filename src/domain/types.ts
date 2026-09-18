/**
 * Domain model — the shape the UI and store work with.
 * Cleaned and normalised from the JSON:API payload (see data/api/mappers).
 */

export interface NumericRange {
  min: number | null;
  max: number | null;
}

export interface BreedOrigin {
  era: string | null;
  region: string | null;
  country: string | null;
}

export type CoatLength = 'short' | 'medium' | 'long' | 'wire' | 'hairless' | 'unknown';

export interface BreedCoat {
  type: string | null;
  colors: string[];
  /** Normalised: "wire" wins over raw length when coat.type is wire */
  length: CoatLength;
}

export const TRAIT_KEYS = [
  'energy',
  'barking',
  'drooling',
  'grooming',
  'shedding',
  'trainability',
  'good_with_dogs',
  'exercise_minutes',
  'apartment_friendly',
  'good_with_children',
  'good_with_strangers',
] as const;

export type TraitKey = (typeof TRAIT_KEYS)[number];

/** Traits filterable by 1-5 threshold */
export const THRESHOLD_TRAIT_KEYS = [
  'good_with_children',
  'good_with_dogs',
  'good_with_strangers',
] as const;

export type ThresholdTraitKey = (typeof THRESHOLD_TRAIT_KEYS)[number];

export type BreedTraits = Record<TraitKey, number | null> & {
  temperament: string[];
};

export interface ImageAttribution {
  author: string | null;
  license: string | null;
  licenseUrl: string | null;
  source: string | null;
  sourceUrl: string | null;
}

export interface BreedImage {
  id: string;
  /** Original upload */
  url: string;
  thumb: string;
  medium: string;
  large: string;
  attribution: ImageAttribution;
}

export interface BreedSource {
  url: string;
  title: string;
}

export type SizeBand = 'small' | 'medium' | 'large' | 'giant' | 'unknown';

export interface Breed {
  id: string;
  name: string;
  description: string;
  life: NumericRange;
  maleWeight: NumericRange;
  femaleWeight: NumericRange;
  maleHeight: NumericRange;
  femaleHeight: NumericRange;
  hypoallergenic: boolean | null;
  origin: BreedOrigin;
  coat: BreedCoat;
  traits: BreedTraits;
  otherNames: string[];
  recognizedBy: string[];
  sources: BreedSource[];
  images: BreedImage[];
  groupId: string | null;
  /** Derived at mapping time so list rows and filters never recompute */
  sizeBand: SizeBand;
  /** Pre-lowercased haystack for search (name + other names) */
  searchText: string;
}

export interface BreedGroup {
  id: string;
  name: string;
  /** Short display label: "Herding Group" -> "Herding" */
  label: string;
  breedIds: string[];
}
