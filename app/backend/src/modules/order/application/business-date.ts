import type { BusinessDayRule } from '../../venue/domain/venue.repository.js';
import { businessDate } from '../../../common/business-date.js';

/**
 * The business day open when the cut-off changed finishes under the old cut-off;
 * the new one applies from the next business day.
 */
export function businessDateUnder(now: Date, rule: BusinessDayRule): string {
  const current = businessDate(now, rule.cutoff);
  if (!rule.previous) return current;
  const old = businessDate(now, rule.previous.cutoff);
  if (old === businessDate(rule.previous.changedAt, rule.previous.cutoff)) return old;
  return old > current ? old : current;
}
