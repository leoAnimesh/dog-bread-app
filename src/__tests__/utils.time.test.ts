import { formatBytes, formatRelativeTime } from '@/utils/time';

describe('formatRelativeTime', () => {
  const now = 1_000_000_000;
  it.each([
    [0, 'just now'],
    [30_000, 'just now'],
    [5 * 60_000, '5 min ago'],
    [59 * 60_000, '59 min ago'],
    [60 * 60_000, '1 hour ago'],
    [2 * 3_600_000, '2 hours ago'],
    [26 * 3_600_000, '1 day ago'],
    [72 * 3_600_000, '3 days ago'],
  ])('%i ms ago -> %s', (delta, expected) => {
    expect(formatRelativeTime(now - delta, now)).toBe(expected);
  });
  it('clamps future timestamps', () => {
    expect(formatRelativeTime(now + 5000, now)).toBe('just now');
  });
});

describe('formatBytes', () => {
  it('picks a unit', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(12.4 * 1024 * 1024)).toBe('12.4 MB');
  });
});
