import { businessDate } from '../../../common/business-date.js';
import { fillDays, hourlyBuckets, previousPeriod, reportWindow } from './report-period.js';

describe('reportWindow', () => {
  it('runs from the first day at the cut-off to the day after the last at the cut-off', () => {
    const window = reportWindow({ from: '2026-10-12', to: '2026-10-14' }, '06:00:00');
    expect(window.start.toISOString()).toBe('2026-10-11T23:00:00.000Z');
    expect(window.end.toISOString()).toBe('2026-10-14T23:00:00.000Z');
  });

  it('puts 01:30 Bangkok in the previous business day, the same as businessDate()', () => {
    const lateNight = new Date('2026-10-14T01:30:00+07:00');
    const window = reportWindow({ from: '2026-10-13', to: '2026-10-13' }, '06:00');
    expect(businessDate(lateNight, '06:00')).toBe('2026-10-13');
    expect(lateNight >= window.start && lateNight < window.end).toBe(true);
  });

  it('keeps the edges half-open: the cut-off instant starts the next day', () => {
    const window = reportWindow({ from: '2026-10-13', to: '2026-10-13' }, '06:00');
    const cutoff = new Date('2026-10-14T06:00:00+07:00');
    expect(window.end.getTime()).toBe(cutoff.getTime());
    expect(businessDate(new Date(cutoff.getTime() - 1), '06:00')).toBe('2026-10-13');
  });
});

describe('previousPeriod', () => {
  it('has the same length and ends the day before', () => {
    expect(previousPeriod({ from: '2026-10-12', to: '2026-10-14' })).toEqual({
      from: '2026-10-09',
      to: '2026-10-11',
    });
    expect(previousPeriod({ from: '2026-10-01', to: '2026-10-01' })).toEqual({
      from: '2026-09-30',
      to: '2026-09-30',
    });
  });
});

describe('fillDays', () => {
  it('returns every date ascending with zeros where nothing happened', () => {
    const days = fillDays({ from: '2026-10-30', to: '2026-11-02' }, [
      { date: '2026-11-01', revenue: '300.00', bills: 2 },
      { date: '2026-10-30', revenue: '120.00', bills: 1 },
    ]);
    expect(days).toEqual([
      { date: '2026-10-30', revenue: '120.00', bills: 1 },
      { date: '2026-10-31', revenue: '0.00', bills: 0 },
      { date: '2026-11-01', revenue: '300.00', bills: 2 },
      { date: '2026-11-02', revenue: '0.00', bills: 0 },
    ]);
  });
});

describe('hourlyBuckets', () => {
  it('has 24 hours starting at the cut-off hour and wraps past midnight', () => {
    const buckets = hourlyBuckets('06:00:00', [
      { hour: 21, revenue: '250.00' },
      { hour: 1, revenue: '80.00' },
    ]);
    expect(buckets).toHaveLength(24);
    expect(buckets.map((bucket) => bucket.hour).slice(0, 3)).toEqual([6, 7, 8]);
    expect(buckets.at(-1)?.hour).toBe(5);
    expect(buckets.find((bucket) => bucket.hour === 21)?.revenue).toBe('250.00');
    expect(buckets.find((bucket) => bucket.hour === 1)?.revenue).toBe('80.00');
    expect(buckets.find((bucket) => bucket.hour === 12)?.revenue).toBe('0.00');
  });

  it('starts at the hour that holds a cut-off with minutes', () => {
    expect(hourlyBuckets('05:30', [])[0]?.hour).toBe(5);
  });
});
