import {
  buildSearchText,
  deriveCoatLength,
  deriveSizeBand,
  shortGroupLabel,
  TRAIT_KEYS,
  type Breed,
  type BreedGroup,
  type BreedImage,
  type BreedTraits,
  type NumericRange,
} from '@/domain';
import {
  isRecord,
  isString,
  optionalBoolean,
  optionalNumber,
  optionalString,
  stringArray,
} from '@/utils/guards';

import type { JsonApiResource } from './dto';

function toRange(value: unknown): NumericRange {
  if (!isRecord(value)) return { min: null, max: null };
  return { min: optionalNumber(value.min), max: optionalNumber(value.max) };
}

function toTraits(value: unknown): BreedTraits {
  const source = isRecord(value) ? value : {};
  const traits = {} as Record<(typeof TRAIT_KEYS)[number], number | null>;
  for (const key of TRAIT_KEYS) {
    traits[key] = optionalNumber(source[key]);
  }
  return { ...traits, temperament: stringArray(source.temperament) };
}

function toImage(value: unknown): BreedImage | null {
  if (!isRecord(value)) return null;
  const url = optionalString(value.url);
  const thumb = optionalString(value.thumb) ?? url;
  const medium = optionalString(value.medium) ?? url;
  const large = optionalString(value.large) ?? url;
  if (!url || !thumb || !medium || !large) return null;
  const attribution = isRecord(value.attribution) ? value.attribution : {};
  return {
    id: optionalString(value.id) ?? url,
    url,
    thumb,
    medium,
    large,
    attribution: {
      author: optionalString(attribution.author),
      license: optionalString(attribution.license),
      licenseUrl: optionalString(attribution.license_url),
      source: optionalString(attribution.source),
      sourceUrl: optionalString(attribution.source_url),
    },
  };
}

function relationshipId(relationships: unknown, key: string): string | null {
  if (!isRecord(relationships)) return null;
  const rel = relationships[key];
  if (!isRecord(rel) || !isRecord(rel.data)) return null;
  return optionalString(rel.data.id);
}

function relationshipIds(relationships: unknown, key: string): string[] {
  if (!isRecord(relationships)) return [];
  const rel = relationships[key];
  if (!isRecord(rel) || !Array.isArray(rel.data)) return [];
  return rel.data
    .map((item) => (isRecord(item) ? optionalString(item.id) : null))
    .filter((id): id is string => id !== null);
}

export function mapBreed(resource: JsonApiResource): Breed {
  const a = resource.attributes;
  const maleWeight = toRange(a.male_weight);
  const femaleWeight = toRange(a.female_weight);
  const coat = isRecord(a.coat) ? a.coat : {};
  const origin = isRecord(a.origin) ? a.origin : {};
  const otherNames = stringArray(a.other_names);
  const name = optionalString(a.name) ?? 'Unnamed breed';

  return {
    id: resource.id,
    name,
    description: optionalString(a.description) ?? '',
    life: toRange(a.life),
    maleWeight,
    femaleWeight,
    maleHeight: toRange(a.male_height),
    femaleHeight: toRange(a.female_height),
    hypoallergenic: optionalBoolean(a.hypoallergenic),
    origin: {
      era: optionalString(origin.era),
      region: optionalString(origin.region),
      country: optionalString(origin.country),
    },
    coat: {
      type: optionalString(coat.type),
      colors: stringArray(coat.colors),
      length: deriveCoatLength(optionalString(coat.length), optionalString(coat.type)),
    },
    traits: toTraits(a.traits),
    otherNames,
    recognizedBy: stringArray(a.recognized_by),
    sources: Array.isArray(a.sources)
      ? a.sources
          .map((s) =>
            isRecord(s) && isString(s.url) ? { url: s.url, title: optionalString(s.title) ?? s.url } : null,
          )
          .filter((s): s is { url: string; title: string } => s !== null)
      : [],
    images: Array.isArray(a.images)
      ? a.images.map(toImage).filter((img): img is BreedImage => img !== null)
      : [],
    groupId: relationshipId(resource.relationships, 'group'),
    sizeBand: deriveSizeBand(maleWeight, femaleWeight),
    searchText: buildSearchText(name, otherNames),
  };
}

export function mapGroup(resource: JsonApiResource): BreedGroup {
  const name = optionalString(resource.attributes.name) ?? 'Ungrouped';
  return {
    id: resource.id,
    name,
    label: shortGroupLabel(name),
    breedIds: relationshipIds(resource.relationships, 'breeds'),
  };
}
