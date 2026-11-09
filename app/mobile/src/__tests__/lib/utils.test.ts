import { formatBaht, timeAgo } from '../../lib/utils';

describe('format utils (AC-7)', () => {
  it('formats baht with tabular currency symbol and 2 decimals', () => {
    expect(formatBaht(1240)).toBe('฿1,240.00');
    expect(formatBaht(0)).toBe('฿0.00');
  });

  it('formats Thai time ago relative to given reference date', () => {
    const base = new Date('2026-11-05T20:00:00.000Z');

    // 30 seconds ago
    const date30s = new Date(base.getTime() - 30 * 1000);
    expect(timeAgo(date30s, base)).toBe('เมื่อกี้');

    // 2 minutes ago
    const date2m = new Date(base.getTime() - 2 * 60 * 1000);
    expect(timeAgo(date2m, base)).toBe('2 นาทีที่แล้ว');

    // 90 minutes ago
    const date90m = new Date(base.getTime() - 90 * 60 * 1000);
    expect(timeAgo(date90m, base)).toBe('1 ชม.ที่แล้ว');
  });
});
