const BANGKOK = 'Asia/Bangkok';
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

export function businessDate(now: Date, cutoff: string): string {
  const local = bangkok(now);
  if (clockSeconds(local.time) < clockSeconds(cutoff)) return previousDay(local.isoDate);
  return local.isoDate;
}

/** Integer key for pg_advisory_xact_lock, one value per business date. */
export function businessDateLockKey(isoDate: string): number {
  return Number(isoDate.replaceAll('-', ''));
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

function clockSeconds(value: string): number {
  const [hours = '0', minutes = '0', seconds = '0'] = value.split(':');
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
}

function previousDay(isoDate: string): string {
  const [year = 0, month = 1, day = 1] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}
