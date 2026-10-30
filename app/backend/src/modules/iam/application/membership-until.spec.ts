import { describe, expect, it } from 'vitest';
import { DomainException } from '../../../common/domain-exception.js';
import { nextCutoff, needsCutoff, resolveUntil } from './membership-until.js';

const at = (iso: string): Date => new Date(iso);

describe('nextCutoff', () => {
  it('at 23:00 Bangkok with cut-off 06:00 → next day 06:00 +07', () => {
    expect(nextCutoff(at('2026-10-30T23:00:00+07:00'), '06:00').toISOString()).toBe(
      at('2026-10-31T06:00:00+07:00').toISOString(),
    );
  });

  it('at 03:00 Bangkok → the same day 06:00', () => {
    expect(nextCutoff(at('2026-10-31T03:00:00+07:00'), '06:00').toISOString()).toBe(
      at('2026-10-31T06:00:00+07:00').toISOString(),
    );
  });

  it('follows a changed cut-off (05:00)', () => {
    expect(nextCutoff(at('2026-10-30T23:00:00+07:00'), '05:00').toISOString()).toBe(
      at('2026-10-31T05:00:00+07:00').toISOString(),
    );
    expect(nextCutoff(at('2026-10-31T05:30:00+07:00'), '05:00').toISOString()).toBe(
      at('2026-11-01T05:00:00+07:00').toISOString(),
    );
  });

  it('exactly at the cut-off the new business day has begun → the next one', () => {
    expect(nextCutoff(at('2026-10-31T06:00:00+07:00'), '06:00').toISOString()).toBe(
      at('2026-11-01T06:00:00+07:00').toISOString(),
    );
  });

  it('crosses a month end', () => {
    expect(nextCutoff(at('2026-10-31T22:00:00+07:00'), '06:00').toISOString()).toBe(
      at('2026-11-01T06:00:00+07:00').toISOString(),
    );
  });
});

describe('resolveUntil', () => {
  const now = at('2026-10-30T23:00:00+07:00');

  it('permanent → null', () => {
    expect(resolveUntil('permanent', now, '06:00')).toBeNull();
  });

  it('an ISO time in the future is kept as is', () => {
    expect(resolveUntil('2026-11-02T10:00:00+07:00', now, '06:00')?.toISOString()).toBe(
      at('2026-11-02T10:00:00+07:00').toISOString(),
    );
  });

  it('a past or present ISO time is a 400', () => {
    for (const until of ['2026-10-30T22:59:59+07:00', now.toISOString()]) {
      expect(() => resolveUntil(until, now, '06:00')).toThrow(DomainException);
    }
  });
});

describe('needsCutoff', () => {
  it('is true only when some input says end_of_night', () => {
    const group = '00000000-0000-4000-8000-0000000b0003';
    expect(needsCutoff([{ groupId: group, until: 'permanent' }])).toBe(false);
    expect(needsCutoff([{ groupId: group, until: 'end_of_night' }])).toBe(true);
  });
});
