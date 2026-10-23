import { z } from 'zod';
import { UuidSchema } from './common.js';
import { ErrorCodeSchema } from './errors.js';
import { MenuItemSchema } from './menu.js';
import { PaymentAttemptSchema } from './payments.js';

// Null on every error except ITEM_UNAVAILABLE (per-line reasons),
// PAYMENT_IN_FLIGHT (the attempt already waiting on the visit) and
// MENU_ITEM_STALE (the item as stored now).
export const ApiErrorDataSchema = z.union([
  z.null(),
  z.object({
    details: z.array(
      z.object({
        variantId: UuidSchema,
        reason: z.enum(['sold_out', 'out_of_window']),
      }),
    ),
  }),
  z.object({
    details: PaymentAttemptSchema,
  }),
  z.object({
    details: MenuItemSchema,
  }),
]);

export const ApiErrorSchema = z.object({
  status: z.number().int(),
  code: ErrorCodeSchema,
  message: z.union([z.string(), z.array(z.string())]),
  data: ApiErrorDataSchema,
});
