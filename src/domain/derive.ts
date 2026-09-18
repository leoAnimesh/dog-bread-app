import type { CoatLength, NumericRange, SizeBand } from './types';

/**
 * Size buckets derived from the *male max weight* (falls back to female),
 * matching the labels the design uses on the Filters screen:
 *   Small ≤10 kg · Medium 10–25 kg · Large 25–45 kg · Giant 45 kg+
 */
export const SIZE_BAND_BOUNDS = {
  small: 10,
  medium: 25,
  large: 45,
} as const;

export function deriveSizeBand(maleWeight: NumericRange, femaleWeight: NumericRange): SizeBand {
  const weight = maleWeight.max ?? femaleWeight.max ?? maleWeight.min ?? femaleWeight.min;
  if (weight === null || Number.isNaN(weight) || weight <= 0) return 'unknown';
  if (weight <= SIZE_BAND_BOUNDS.small) return 'small';
  if (weight <= SIZE_BAND_BOUNDS.medium) return 'medium';
  if (weight <= SIZE_BAND_BOUNDS.large) return 'large';
  return 'giant';
}

/**
 * The API stores "wire" under coat.type, not coat.length, and length can be
 * null or "hairless". The filter spec wants short/medium/long/wire so we fold
 * type into length when it disambiguates.
 */
export function deriveCoatLength(
  rawLength: string | null | undefined,
  rawType: string | null | undefined,
): CoatLength {
  const type = (rawType ?? '').trim().toLowerCase();
  if (type === 'wire' || type === 'wiry') return 'wire';

  const length = (rawLength ?? '').trim().toLowerCase();
  switch (length) {
    case 'short':
    case 'medium':
    case 'long':
    case 'hairless':
      return length;
    case 'wire':
      return 'wire';
    default:
      if (type === 'hairless') return 'hairless';
      return 'unknown';
  }
}

export function buildSearchText(name: string, otherNames: readonly string[]): string {
  return [name, ...otherNames]
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .join(' | ');
}

/** "Herding Group" -> "Herding", "Miscellaneous Class" -> "Miscellaneous" */
export function shortGroupLabel(name: string): string {
  return name.replace(/\s+(Group|Class)$/i, '').trim();
}
