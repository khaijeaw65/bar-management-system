import { z } from 'zod';
import { UuidSchema } from './common.js';
import { ErrorCodeSchema } from './errors.js';
import { PaymentAttemptSchema } from './payments.js';

// Null on every error except ITEM_UNAVAILABLE (per-line reasons) and
// PAYMENT_IN_FLIGHT (the attempt already waiting on the visit).
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
]);

export const ApiErrorSchema = z.object({
  status: z.number().int(),
  code: ErrorCodeSchema,
  message: z.union([z.string(), z.array(z.string())]),
  data: ApiErrorDataSchema,
});
