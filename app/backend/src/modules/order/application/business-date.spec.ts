import { businessDate, businessDateUnder } from './business-date.js';

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

describe('businessDateUnder', () => {
  // Bangkok = UTC+7. Changed at 23:00 on 16 Oct (16:00Z), from 06:00 to 05:00.
  const changedAt = new Date('2026-10-16T16:00:00.000Z');
  const earlier = { cutoff: '05:00', previous: { cutoff: '06:00', changedAt } };

  it('is the plain cut-off when nothing changed', () => {
    const now = new Date('2026-10-16T22:30:00.000Z');
    expect(businessDateUnder(now, { cutoff: '05:00', previous: null })).toBe('2026-10-17');
  });

  it('keeps tonight on the old cut-off after an earlier one is saved (05:30 is still tonight)', () => {
    const lateNight = new Date('2026-10-16T22:30:00.000Z');
    expect(businessDateUnder(lateNight, earlier)).toBe('2026-10-16');
  });

  it('applies the new cut-off from the next business day', () => {
    const nextBusinessDay = new Date('2026-10-17T22:30:00.000Z');
    expect(businessDateUnder(nextBusinessDay, earlier)).toBe('2026-10-18');
    const justAfterNewCutoff = new Date('2026-10-16T22:00:00.000Z');
    expect(businessDateUnder(justAfterNewCutoff, earlier)).toBe('2026-10-16');
  });

  it('does not start the next day early when a later cut-off is saved', () => {
    const later = { cutoff: '07:00', previous: { cutoff: '06:00', changedAt } };
    const sixThirty = new Date('2026-10-16T23:30:00.000Z');
    expect(businessDateUnder(sixThirty, later)).toBe('2026-10-17');
  });
});
