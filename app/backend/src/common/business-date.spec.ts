import { addDays, businessDate, businessDayStart, daysBetweenInclusive } from './business-date.js';

describe('businessDate', () => {
  const cutoff = '06:00';

  it('uses the previous day before the Bangkok cut-off', () => {
    const before = new Date('2026-10-16T22:59:00.000Z');
    expect(businessDate(before, cutoff)).toBe('2026-10-16');
  });

  it('uses the current day at the cut-off', () => {
    const atCutoff = new Date('2026-10-16T23:00:00.000Z');
    expect(businessDate(atCutoff, cutoff)).toBe('2026-10-17');
  });

  it('counts 05:59 on the next calendar day as the same business day', () => {
    expect(businessDate(new Date('2026-10-17T22:59:59.000Z'), cutoff)).toBe('2026-10-17');
  });
});

describe('businessDayStart', () => {
  it('is the cut-off on that date in Bangkok, and businessDate maps it back', () => {
    const start = businessDayStart('2026-10-17', '06:00');
    expect(start.toISOString()).toBe('2026-10-16T23:00:00.000Z');
    expect(businessDate(start, '06:00')).toBe('2026-10-17');
    expect(businessDate(new Date(start.getTime() - 1), '06:00')).toBe('2026-10-16');
  });

  it('handles a cut-off at midnight and one with minutes', () => {
    expect(businessDayStart('2026-10-17', '00:00').toISOString()).toBe('2026-10-16T17:00:00.000Z');
    expect(businessDayStart('2026-10-17', '05:30').toISOString()).toBe('2026-10-16T22:30:00.000Z');
  });
});

describe('addDays / daysBetweenInclusive', () => {
  it('crosses month and year ends', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(daysBetweenInclusive('2026-10-01', '2026-10-01')).toBe(1);
    expect(daysBetweenInclusive('2026-12-31', '2027-01-02')).toBe(3);
  });
});
