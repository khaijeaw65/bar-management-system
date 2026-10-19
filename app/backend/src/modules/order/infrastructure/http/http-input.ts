import type { PlaceOrderRequest } from '@bar/contracts';
import { blankToNull } from '../../../../common/http/http-input.js';
import type { RequestedLine } from '../../application/order.types.js';

export { idempotencyKey } from '../../../../common/idempotency/idempotency-key.js';

export function requestedLines(body: PlaceOrderRequest): RequestedLine[] {
  return body.items.map((item) => ({
    variantId: item.variantId,
    quantity: item.quantity,
    modifierOptionIds: item.modifierOptionIds ?? [],
    orderedByName: blankToNull(item.orderedByName),
    notes: blankToNull(item.notes),
  }));
}
