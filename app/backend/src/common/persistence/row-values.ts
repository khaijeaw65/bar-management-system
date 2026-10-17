export function readText(value: unknown): string {
  if (typeof value !== 'string') throw new Error('row is missing a string');
  return value;
}

export function readOptionalText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return readText(value);
}

export function readDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  throw new Error('row is missing a timestamp');
}

export function readOptionalDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  return readDate(value);
}
