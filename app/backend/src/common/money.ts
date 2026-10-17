/** NUMERIC(10,2) on the wire. Truncates extra fraction digits. */
export function money(value: string | number): string {
  const [whole = '0', fraction = ''] = String(value).split('.');
  return `${whole}.${`${fraction}00`.slice(0, 2)}`;
}
