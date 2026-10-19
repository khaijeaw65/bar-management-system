import { createHash } from 'node:crypto';

export function requestHash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(sortValue(value))).digest('hex');
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (!value || typeof value !== 'object') return value;
  const source = value as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(source).sort()) sorted[key] = sortValue(source[key]);
  return sorted;
}
