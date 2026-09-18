import { buildSections } from '@/hooks/useBreedList';

import { fixtureBreeds, fixtureGroups } from './testUtils';

describe('buildSections', () => {
  const groupsById = Object.fromEntries(fixtureGroups.map((g) => [g.id, g]));
  const groupIds = fixtureGroups.map((g) => g.id);

  it('emits a header per group followed by its rows, groups alphabetical', () => {
    const items = buildSections(fixtureBreeds, groupsById, groupIds);
    const headers = items.filter((i) => i.kind === 'header');
    expect(headers.length).toBeGreaterThan(0);
    let lastLabel = '';
    for (const h of headers) {
      if (h.kind === 'header') {
        expect(h.label >= lastLabel).toBe(true);
        lastLabel = h.label;
      }
    }
    // Each header's count matches the rows that follow it
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i]!;
      if (item.kind !== 'header') continue;
      let rows = 0;
      for (let j = i + 1; j < items.length && items[j]!.kind === 'row'; j += 1) rows += 1;
      expect(rows).toBe(item.count);
    }
    expect(items.filter((i) => i.kind === 'row')).toHaveLength(fixtureBreeds.length);
  });

  it('puts breeds with unknown group under "Other" at the end', () => {
    const orphan = { ...fixtureBreeds[0]!, id: 'orphan', groupId: 'missing-group' };
    const items = buildSections([orphan], groupsById, groupIds);
    expect(items[0]).toMatchObject({ kind: 'header', label: 'OTHER', count: 1 });
  });

  it('returns nothing for no breeds', () => {
    expect(buildSections([], groupsById, groupIds)).toEqual([]);
  });
});
