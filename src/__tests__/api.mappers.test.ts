import { parseCollection, parseSingle } from '@/data/api/dto';
import { mapBreed } from '@/data/api/mappers';

import breedsPage from './fixtures/breeds-page.json';
import { breedNamed, fixtureBreeds, fixtureGroups } from './testUtils';

describe('parseCollection', () => {
  it('reads pagination meta and drops malformed resources', () => {
    const result = parseCollection({
      data: [{ id: '1', type: 'breed', attributes: {} }, { nope: true }, null],
      meta: { pagination: { current: 2, next: 3, last: 6, records: 283 } },
    });
    expect(result.data).toHaveLength(1);
    expect(result.meta?.pagination).toEqual({ current: 2, next: 3, last: 6, records: 283 });
  });
  it('throws on a payload without a data array', () => {
    expect(() => parseCollection({ data: 'x' })).toThrow(TypeError);
    expect(() => parseSingle({ data: null })).toThrow(TypeError);
  });
});

describe('mapBreed with real API fixtures', () => {
  it('maps the full record', () => {
    const affen = breedNamed('Affenpinscher');
    expect(affen.id).toBe('036feed0-da8a-42c9-ab9a-57449b530b13');
    expect(affen.life).toEqual({ min: 14, max: 16 });
    expect(affen.hypoallergenic).toBe(true);
    expect(affen.origin.country).toBe('Germany');
    expect(affen.otherNames).toContain('Monkey Terrier');
    expect(affen.recognizedBy).toContain('AKC');
    expect(affen.traits.energy).toBe(3);
    expect(affen.traits.exercise_minutes).toBe(30);
    expect(affen.traits.temperament).toContain('playful');
    expect(affen.groupId).toBe('f56dc4b1-ba1a-4454-8ce2-bd5d41404a0c');
    expect(affen.searchText).toBe('affenpinscher | monkey terrier | affen | diablotin moustachu');
  });

  it('derives size band and coat length from messy source data', () => {
    expect(breedNamed('Affenpinscher').sizeBand).toBe('small');
    expect(breedNamed('Affenpinscher').coat.length).toBe('wire'); // length says short, type says wire
    expect(breedNamed('American Hairless Terrier').coat.length).toBe('hairless');
    expect(breedNamed('Bavarian Mountain Scent Hound').coat.length).toBe('unknown'); // null coat
    expect(breedNamed('Bavarian Mountain Scent Hound').sizeBand).toBe('large');
    expect(breedNamed('Akita').sizeBand).toBe('giant');
  });

  it('keeps every image variant and its attribution', () => {
    const [img] = breedNamed('Affenpinscher').images;
    expect(img).toBeDefined();
    expect(img?.thumb).toMatch(/^https:\/\/images\.dogapi\.dog\//);
    expect(img?.medium).toBeTruthy();
    expect(img?.large).toBeTruthy();
    expect(img?.attribution.author).toBe('Futurebreak');
    expect(img?.attribution.license).toBe('CC0');
    expect(img?.attribution.sourceUrl).toContain('wikimedia');
  });

  it('never throws on missing attributes — produces a safe empty record', () => {
    const breed = mapBreed({ id: 'x', type: 'breed', attributes: { name: '  ' } });
    expect(breed.name).toBe('Unnamed breed');
    expect(breed.images).toEqual([]);
    expect(breed.traits.energy).toBeNull();
    expect(breed.traits.temperament).toEqual([]);
    expect(breed.sizeBand).toBe('unknown');
    expect(breed.coat.length).toBe('unknown');
    expect(breed.groupId).toBeNull();
  });

  it('drops images with no usable url and coerces numeric strings', () => {
    const breed = mapBreed({
      id: 'y',
      type: 'breed',
      attributes: {
        name: 'Test',
        images: [{ id: 'a' }, { url: 'https://x/y' }],
        life: { min: '10', max: 'twelve' },
      },
    });
    expect(breed.images).toHaveLength(1);
    expect(breed.images[0]?.thumb).toBe('https://x/y');
    expect(breed.life).toEqual({ min: 10, max: null });
  });

  it('fixture sanity: 4 breeds, 9 groups with labels', () => {
    expect(fixtureBreeds).toHaveLength(4);
    expect((breedsPage as { data: unknown[] }).data).toHaveLength(4);
    expect(fixtureGroups).toHaveLength(9);
    expect(fixtureGroups.map((g) => g.label)).toContain('Herding');
    expect(fixtureGroups.find((g) => g.label === 'Herding')?.breedIds.length).toBeGreaterThan(0);
  });
});
