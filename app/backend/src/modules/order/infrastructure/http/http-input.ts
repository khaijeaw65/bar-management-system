import { UuidSchema, type PlaceOrderRequest } from '@bar/contracts';
import { DomainException } from '../../../../common/domain-exception.js';
import { blankToNull } from '../../../../common/http/http-input.js';
import type { RequestedLine } from '../../application/order.types.js';

export function idempotencyKey(header: string | undefined): string | null {
  if (!header) return null;
  const parsed = UuidSchema.safeParse(header);
  if (!parsed.success) throw new DomainException('VALIDATION_ERROR', 'คีย์ไม่ถูกต้อง', 400);
  return parsed.data;
}

export function requestedLines(body: PlaceOrderRequest): RequestedLine[] {
  return body.items.map((item) => ({
    variantId: item.variantId,
    quantity: item.quantity,
    modifierOptionIds: item.modifierOptionIds ?? [],
    orderedByName: blankToNull(item.orderedByName),
    notes: blankToNull(item.notes),
  }));
}
