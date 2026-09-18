import type { ImageCacheEntry } from '@/data/db/repositories/ImageCacheRepository';
import { fileNameForUrl, selectEvictions } from '@/data/images/ImageCacheService';

const entry = (url: string, bytes: number, lastAccess: number): ImageCacheEntry => ({
  url,
  localUri: `file:///cache/${url}`,
  variant: 'thumb',
  bytes,
  lastAccess,
});

describe('selectEvictions (LRU)', () => {
  it('evicts oldest-first until under the limit', () => {
    const entries = [entry('a', 40, 1), entry('b', 30, 2), entry('c', 50, 3)];
    const victims = selectEvictions(entries, 120, 60);
    expect(victims.map((v) => v.url)).toEqual(['a', 'b']);
  });
  it('skips protected urls and returns nothing when within budget', () => {
    const entries = [entry('a', 40, 1), entry('b', 30, 2), entry('c', 50, 3)];
    expect(selectEvictions(entries, 120, 90, new Set(['a'])).map((v) => v.url)).toEqual(['b']);
    expect(selectEvictions(entries, 100, 100)).toEqual([]);
  });
});

describe('fileNameForUrl', () => {
  it('is deterministic and filesystem safe', () => {
    const a = fileNameForUrl('https://images.dogapi.dog/abc?x=1');
    expect(a).toBe(fileNameForUrl('https://images.dogapi.dog/abc?x=1'));
    expect(a).toMatch(/^[0-9a-f]+-[A-Za-z0-9_-]+$/);
    expect(fileNameForUrl('https://images.dogapi.dog/def')).not.toBe(a);
  });
});
