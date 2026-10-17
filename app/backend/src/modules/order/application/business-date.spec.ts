import { businessDate } from './business-date.js';

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
});
