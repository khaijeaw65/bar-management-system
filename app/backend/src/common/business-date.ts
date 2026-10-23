import { clockSeconds } from './time-label.js';

const BANGKOK = 'Asia/Bangkok';
// Bangkok has no daylight saving, so a fixed offset turns local clock time into an instant.
const BANGKOK_OFFSET_SECONDS = 7 * 3600;
const DAY_MS = 24 * 3600 * 1000;
const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: BANGKOK,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

/** Business day (DR-014 #4): before the Bangkok cut-off still counts as the previous day. */
export function businessDate(now: Date, cutoff: string): string {
  const local = bangkok(now);
  if (clockSeconds(local.time) < clockSeconds(cutoff)) return addDays(local.isoDate, -1);
  return local.isoDate;
}

/** The instant a business day begins: that date at the cut-off, Bangkok time. */
export function businessDayStart(isoDate: string, cutoff: string): Date {
  const seconds = clockSeconds(cutoff) - BANGKOK_OFFSET_SECONDS;
  return new Date(utcMidnight(isoDate) + seconds * 1000);
}

/** Integer key for pg_advisory_xact_lock, one value per business date. */
export function businessDateLockKey(isoDate: string): number {
  return Number(isoDate.replaceAll('-', ''));
}

export function addDays(isoDate: string, days: number): string {
  return new Date(utcMidnight(isoDate) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to`, both inclusive. */
export function daysBetweenInclusive(from: string, to: string): number {
  return Math.round((utcMidnight(to) - utcMidnight(from)) / DAY_MS) + 1;
}

function utcMidnight(isoDate: string): number {
  const [year = 0, month = 1, day = 1] = isoDate.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

function bangkok(now: Date): { isoDate: string; time: string } {
  const parts = formatter.formatToParts(now);
  const read = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '';
  const hour = read('hour') === '24' ? '00' : read('hour');
  return {
    isoDate: `${read('year')}-${read('month')}-${read('day')}`,
    time: `${hour}:${read('minute')}:${read('second')}`,
  };
}
