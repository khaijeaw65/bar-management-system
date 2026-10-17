/** Postgres TIME and a Date that node parsed from TIME, as HH:mm. */
export function hhmm(value: string | Date): string {
  if (value instanceof Date) {
    return `${two(value.getUTCHours())}:${two(value.getUTCMinutes())}`;
  }
  return value.slice(0, 5);
}

function two(value: number): string {
  return String(value).padStart(2, '0');
}
