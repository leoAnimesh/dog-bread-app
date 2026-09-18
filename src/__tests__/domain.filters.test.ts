import {
  countActiveFilters,
  EMPTY_FILTERS,
  matchesFilters,
  matchesQuery,
  normaliseQuery,
  toggleInList,
  type BreedFilters,
} from '@/domain/filters';

import { breedNamed, fixtureBreeds } from './testUtils';

describe('matchesFilters', () => {
  const affen = breedNamed('Affenpinscher'); // small, wire, hypoallergenic, kids 3
  const akita = breedNamed('Akita'); // giant, medium coat

  it('passes everything with empty filters', () => {
    expect(fixtureBreeds.every((b) => matchesFilters(b, EMPTY_FILTERS))).toBe(true);
  });

  it('filters by group id', () => {
    const f: BreedFilters = { ...EMPTY_FILTERS, groupIds: [affen.groupId ?? ''] };
    expect(matchesFilters(affen, f)).toBe(true);
    expect(matchesFilters({ ...affen, groupId: null }, f)).toBe(false);
  });

  it('filters by size band and coat length (multi-select is OR within a facet)', () => {
    expect(matchesFilters(affen, { ...EMPTY_FILTERS, sizeBands: ['small'] })).toBe(true);
    expect(matchesFilters(akita, { ...EMPTY_FILTERS, sizeBands: ['small', 'medium'] })).toBe(false);
    expect(matchesFilters(akita, { ...EMPTY_FILTERS, sizeBands: ['small', 'giant'] })).toBe(true);
    expect(matchesFilters(affen, { ...EMPTY_FILTERS, coatLengths: ['wire'] })).toBe(true);
    expect(matchesFilters(affen, { ...EMPTY_FILTERS, coatLengths: ['short'] })).toBe(false);
  });

  it('hypoallergenic tri-state', () => {
    expect(matchesFilters(affen, { ...EMPTY_FILTERS, hypoallergenic: 'yes' })).toBe(true);
    expect(matchesFilters(affen, { ...EMPTY_FILTERS, hypoallergenic: 'no' })).toBe(false);
    expect(matchesFilters({ ...affen, hypoallergenic: null }, { ...EMPTY_FILTERS, hypoallergenic: 'yes' })).toBe(false);
  });

  it('trait threshold requires score >= min and rejects nulls', () => {
    const f: BreedFilters = { ...EMPTY_FILTERS, traitThreshold: { trait: 'good_with_children', min: 3 } };
    expect(matchesFilters(affen, f)).toBe(true);
    expect(matchesFilters(affen, { ...f, traitThreshold: { trait: 'good_with_children', min: 4 } })).toBe(false);
    const noScore = { ...affen, traits: { ...affen.traits, good_with_children: null } };
    expect(matchesFilters(noScore, f)).toBe(false);
  });

  it('facets combine with AND', () => {
    const f: BreedFilters = { ...EMPTY_FILTERS, sizeBands: ['small'], hypoallergenic: 'no' };
    expect(matchesFilters(affen, f)).toBe(false);
  });
});

describe('matchesQuery', () => {
  const affen = breedNamed('Affenpinscher');
  it('matches name and other_names case-insensitively', () => {
    expect(matchesQuery(affen, normaliseQuery('  AFFEN '))).toBe(true);
    expect(matchesQuery(affen, normaliseQuery('monkey terrier'))).toBe(true);
    expect(matchesQuery(affen, normaliseQuery('collie'))).toBe(false);
    expect(matchesQuery(affen, '')).toBe(true);
  });
});

describe('countActiveFilters / toggleInList', () => {
  it('counts each selected value plus toggles', () => {
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0);
    expect(
      countActiveFilters({
        groupIds: ['a', 'b'],
        sizeBands: ['small'],
        coatLengths: [],
        hypoallergenic: 'yes',
        traitThreshold: { trait: 'good_with_dogs', min: 2 },
      }),
    ).toBe(5);
  });
  it('toggles membership immutably', () => {
    const list = ['a'];
    expect(toggleInList(list, 'b')).toEqual(['a', 'b']);
    expect(toggleInList(list, 'a')).toEqual([]);
    expect(list).toEqual(['a']);
  });
});
