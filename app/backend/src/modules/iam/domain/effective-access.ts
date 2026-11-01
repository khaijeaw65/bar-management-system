import type { MembershipRow } from './permission-source.types.js';

export const CACHE_TTL_CAP_SECONDS = 15 * 60;

export interface ActiveGroups {
  groups: Array<{ id: string; name: string; validUntil: string | null }>;
  /** Next moment the active set changes: an end of a live membership or the start of a future one. */
  nextChange: Date | null;
}

/** A membership counts only inside [valid_from, valid_until) — CD-13 D1. */
export function activeGroups(rows: MembershipRow[], now: Date): ActiveGroups {
  const groups: ActiveGroups['groups'] = [];
  let nextChange: Date | null = null;
  const consider = (moment: Date): void => {
    if (moment > now && (nextChange === null || moment < nextChange)) nextChange = moment;
  };
  for (const row of rows) {
    consider(row.validFrom);
    if (row.validUntil) consider(row.validUntil);
    const started = row.validFrom <= now;
    const notEnded = row.validUntil === null || row.validUntil > now;
    if (started && notEnded) {
      groups.push({ id: row.groupId, name: row.groupName, validUntil: row.validUntil?.toISOString() ?? null });
    }
  }
  return { groups, nextChange };
}

/** Cache lifetime: the 15-minute cap, never past the next membership change. At least 1 s. */
export function cacheTtlSeconds(nextChange: Date | null, now: Date): number {
  if (nextChange === null) return CACHE_TTL_CAP_SECONDS;
  const untilChange = Math.ceil((nextChange.getTime() - now.getTime()) / 1000);
  return Math.max(1, Math.min(CACHE_TTL_CAP_SECONDS, untilChange));
}
