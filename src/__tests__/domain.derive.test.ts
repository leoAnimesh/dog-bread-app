import { buildSearchText, deriveCoatLength, deriveSizeBand, shortGroupLabel } from '@/domain/derive';

describe('deriveSizeBand', () => {
  const r = (min: number | null, max: number | null) => ({ min, max });

  it('buckets on male max weight', () => {
    expect(deriveSizeBand(r(4, 6), r(4, 6))).toBe('small');
    expect(deriveSizeBand(r(4, 10), r(4, 9))).toBe('small');
    expect(deriveSizeBand(r(14, 20), r(12, 19))).toBe('medium');
    expect(deriveSizeBand(r(20, 25), r(18, 22))).toBe('medium');
    expect(deriveSizeBand(r(25, 40), r(20, 30))).toBe('large');
    expect(deriveSizeBand(r(35, 60), r(30, 50))).toBe('giant');
  });

  it('falls back to female weight, then to min, then unknown', () => {
    expect(deriveSizeBand(r(null, null), r(20, 30))).toBe('large');
    expect(deriveSizeBand(r(50, null), r(null, null))).toBe('giant');
    expect(deriveSizeBand(r(null, null), r(null, null))).toBe('unknown');
    expect(deriveSizeBand(r(null, 0), r(null, -3))).toBe('unknown');
  });
});

describe('deriveCoatLength', () => {
  it('normalises the four filterable lengths', () => {
    expect(deriveCoatLength('short', 'smooth')).toBe('short');
    expect(deriveCoatLength('Medium', 'double')).toBe('medium');
    expect(deriveCoatLength(' long ', null)).toBe('long');
  });

  it('promotes wire from coat.type — the API never puts it in length', () => {
    expect(deriveCoatLength('short', 'wire')).toBe('wire');
    expect(deriveCoatLength(null, 'wiry')).toBe('wire');
  });

  it('handles hairless, null and garbage', () => {
    expect(deriveCoatLength('hairless', 'hairless')).toBe('hairless');
    expect(deriveCoatLength(null, 'hairless')).toBe('hairless');
    expect(deriveCoatLength(null, null)).toBe('unknown');
    expect(deriveCoatLength('fluffy', 'unknown')).toBe('unknown');
  });
});

describe('buildSearchText / shortGroupLabel', () => {
  it('lowercases and joins names', () => {
    expect(buildSearchText('Border Collie', ['Scottish Sheep Dog', ' '])).toBe(
      'border collie | scottish sheep dog',
    );
  });
  it('strips Group / Class suffixes', () => {
    expect(shortGroupLabel('Herding Group')).toBe('Herding');
    expect(shortGroupLabel('Miscellaneous Class')).toBe('Miscellaneous');
    expect(shortGroupLabel('Foundation Stock Service')).toBe('Foundation Stock Service');
  });
});
