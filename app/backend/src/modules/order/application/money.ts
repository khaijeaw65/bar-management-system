/** NUMERIC(10,2) on the wire. Truncates extra fraction digits. */
export function money(value: string | number): string {
  const [whole = '0', fraction = ''] = String(value).split('.');
  return `${whole}.${`${fraction}00`.slice(0, 2)}`;
}

export function toCents(value: string): number {
  const negative = value.startsWith('-');
  const [whole = '0', fraction = ''] = value.replace('-', '').split('.');
  const cents = Number(whole) * 100 + Number(`${fraction}00`.slice(0, 2));
  return negative ? -cents : cents;
}

export function fromCents(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const absolute = Math.abs(cents);
  const fraction = String(absolute % 100).padStart(2, '0');
  return `${sign}${Math.trunc(absolute / 100)}.${fraction}`;
}

export function lineCents(unit: string, deltas: readonly string[], quantity: number): number {
  const one = deltas.reduce((sum, delta) => sum + toCents(delta), toCents(unit));
  return one * quantity;
}
