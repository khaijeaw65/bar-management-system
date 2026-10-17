import type { OrderQuery } from '../../domain/order.types.js';

export function orderWhere(query: OrderQuery, values: unknown[]): string {
  const parts = ['TRUE'];
  if (query.orderId) parts.push(`o.id = $${bind(values, query.orderId)}::uuid`);
  if (query.visitId) parts.push(`o.visit_id = $${bind(values, query.visitId)}::uuid`);
  if (query.ticketId) parts.push(`t.id = $${bind(values, query.ticketId)}::uuid`);
  if (query.statuses) {
    parts.push(`t.status::text = ANY($${bind(values, query.statuses)}::text[])`);
  }
  if (query.excludeCharge) parts.push('t.station IS NOT NULL');
  return `WHERE ${parts.join(' AND ')}`;
}

function bind(values: unknown[], value: unknown): number {
  values.push(value);
  return values.length;
}

export function rowList(result: unknown): Record<string, unknown>[] {
  if (!Array.isArray(result)) return [];
  const nested: unknown = result[0];
  if (Array.isArray(nested) && result.length === 2 && typeof result[1] === 'number') {
    return nested as Record<string, unknown>[];
  }
  return result as Record<string, unknown>[];
}
