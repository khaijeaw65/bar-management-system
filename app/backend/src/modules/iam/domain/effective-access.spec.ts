import { activeGroups, cacheTtlSeconds } from './effective-access.js';
import type { MembershipRow } from './permission-source.js';

const NOW = new Date('2026-10-30T10:00:00.000Z');
const at = (iso: string): Date => new Date(iso);
const row = (validFrom: string, validUntil: string | null, groupId = 'g1'): MembershipRow => ({
  groupId,
  groupName: groupId,
  validFrom: at(validFrom),
  validUntil: validUntil ? at(validUntil) : null,
});

describe('activeGroups', () => {
  it('counts a permanent membership', () => {
    const result = activeGroups([row('2026-10-01T00:00:00Z', null)], NOW);
    expect(result.groups).toEqual([{ id: 'g1', name: 'g1', validUntil: null }]);
    expect(result.nextChange).toBeNull();
  });

  it('drops an ended membership and a not-yet-started one', () => {
    const ended = row('2026-10-01T00:00:00Z', '2026-10-30T09:59:59Z', 'ended');
    const future = row('2026-10-30T12:00:00Z', null, 'future');
    const result = activeGroups([ended, future], NOW);
    expect(result.groups).toEqual([]);
    expect(result.nextChange).toEqual(at('2026-10-30T12:00:00Z'));
  });

  it('treats valid_until as exclusive and valid_from as inclusive', () => {
    expect(activeGroups([row('2026-10-30T10:00:00Z', null)], NOW).groups).toHaveLength(1);
    expect(activeGroups([row('2026-10-01T00:00:00Z', '2026-10-30T10:00:00Z')], NOW).groups).toHaveLength(0);
  });

  it('reports the nearest change among live ends and future starts', () => {
    const live = row('2026-10-01T00:00:00Z', '2026-10-30T11:00:00Z', 'a');
    const later = row('2026-10-30T10:30:00Z', null, 'b');
    expect(activeGroups([live, later], NOW).nextChange).toEqual(at('2026-10-30T10:30:00Z'));
  });
});

describe('cacheTtlSeconds', () => {
  it('uses the 15-minute cap when nothing changes', () => {
    expect(cacheTtlSeconds(null, NOW)).toBe(900);
  });

  it('never outlives the next membership change', () => {
    expect(cacheTtlSeconds(at('2026-10-30T10:00:42.000Z'), NOW)).toBe(42);
    expect(cacheTtlSeconds(at('2026-10-30T10:00:41.200Z'), NOW)).toBe(42);
  });

  it('caps a far change at 15 minutes and floors at one second', () => {
    expect(cacheTtlSeconds(at('2026-11-30T00:00:00Z'), NOW)).toBe(900);
    expect(cacheTtlSeconds(at('2026-10-30T10:00:00.100Z'), NOW)).toBe(1);
  });
});
