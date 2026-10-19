/** NUMERIC(10,2) on the wire. Truncates extra fraction digits. */
export function money(value: string | number): string {
  return fromSatang(toSatang(String(value)));
}

export function toSatang(value: string): number {
  const negative = value.startsWith('-');
  const [whole = '0', fraction = ''] = value.replace('-', '').split('.');
  const satang = Number(whole) * 100 + Number(`${fraction}00`.slice(0, 2));
  return negative ? -satang : satang;
}

export function fromSatang(satang: number): string {
  const sign = satang < 0 ? '-' : '';
  const absolute = Math.abs(satang);
  const fraction = String(absolute % 100).padStart(2, '0');
  return `${sign}${Math.trunc(absolute / 100)}.${fraction}`;
}

export function sumSatang(values: readonly string[]): string {
  return fromSatang(values.reduce((sum, value) => sum + toSatang(value), 0));
}
