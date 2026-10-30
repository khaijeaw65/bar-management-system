import type { MembershipInput } from '@bar/contracts';
import { addDays, businessDate, businessDayStart } from '../../../common/business-date.js';
import { DomainException } from '../../../common/domain-exception.js';

/** `end_of_night` = the next business-day cut-off after `now` (DR-014 #4), real wall-clock time. */
export function nextCutoff(now: Date, cutoff: string): Date {
  return businessDayStart(addDays(businessDate(now, cutoff), 1), cutoff);
}

export function needsCutoff(inputs: MembershipInput[]): boolean {
  return inputs.some((input) => input.until === 'end_of_night');
}

/** `permanent` → NULL; a past ISO time is a 400. `cutoff` is only read for `end_of_night`. */
export function resolveUntil(until: MembershipInput['until'], now: Date, cutoff: string): Date | null {
  if (until === 'permanent') return null;
  if (until === 'end_of_night') return nextCutoff(now, cutoff);
  const at = new Date(until);
  if (at.getTime() <= now.getTime()) {
    throw new DomainException('VALIDATION_ERROR', 'เวลาสิ้นสุดต้องอยู่ในอนาคต', 400);
  }
  return at;
}
