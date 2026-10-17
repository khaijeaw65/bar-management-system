import { clockSeconds } from '../../../common/time-label.js';

export interface MenuWindowInput {
  daysOfWeek: readonly number[];
  startTime: string;
  endTime: string;
}

export interface MenuAvailabilityInput {
  categoryActive: boolean;
  isAvailable: boolean;
  windows: readonly MenuWindowInput[];
}

export interface MenuAvailabilityDecision {
  listed: boolean;
  availableNow: boolean;
  unavailableReason: 'sold_out' | 'out_of_window' | null;
}

const BANGKOK = 'Asia/Bangkok';

const WEEKDAY: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

/**
 * One rule for the menu list, item detail, and getOrderable.
 * days_of_week is the day the window starts. end < start crosses midnight.
 * The end instant is exclusive (21:00 is already out).
 */
export function menuAvailability(
  input: MenuAvailabilityInput,
  now: Date,
): MenuAvailabilityDecision {
  const inside =
    input.windows.length === 0 ||
    input.windows.some((window) => windowContains(window, now));
  // An inactive category is hidden from the list and not orderable.
  // sold_out is the reason BRIEF-012 can attach; the contract has no other code.
  const unavailableReason =
    !input.categoryActive || !input.isAvailable
      ? 'sold_out'
      : input.windows.length > 0 && !inside
        ? 'out_of_window'
        : null;
  return {
    listed: input.categoryActive,
    availableNow: input.categoryActive && input.isAvailable && inside,
    unavailableReason,
  };
}

function windowContains(window: MenuWindowInput, now: Date): boolean {
  const { isoWeekday, seconds } = bangkok(now);
  const start = clockSeconds(window.startTime);
  const end = clockSeconds(window.endTime);
  if (end > start) {
    return (
      window.daysOfWeek.includes(isoWeekday) &&
      seconds >= start &&
      seconds < end
    );
  }
  const yesterday = isoWeekday === 1 ? 7 : isoWeekday - 1;
  const startedToday =
    window.daysOfWeek.includes(isoWeekday) && seconds >= start;
  const stillOpen = window.daysOfWeek.includes(yesterday) && seconds < end;
  return startedToday || stillOpen;
}

function bangkok(now: Date): { isoWeekday: number; seconds: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BANGKOK,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const read = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '';
  let hour = Number(read('hour'));
  if (hour === 24) hour = 0;
  const isoWeekday = WEEKDAY[read('weekday')];
  if (isoWeekday === undefined) {
    throw new Error(`unrecognized Bangkok weekday: ${read('weekday')}`);
  }
  return {
    isoWeekday,
    seconds: hour * 3600 + Number(read('minute')) * 60 + Number(read('second')),
  };
}

