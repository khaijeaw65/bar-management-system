import { z } from 'zod';
import { MoneySchema, UuidSchema } from '../schemas/common.js';
import {
  PaymentConfirmedViaSchema,
  PaymentStatusReasonSchema,
  PaymentStatusSchema,
} from '../schemas/enums.js';

export const PAYMENT_STATUS_CHANGED = 'payment.status_changed';

export const PaymentStatusChangedPayloadSchema = z.object({
  paymentId: UuidSchema,
  attemptId: UuidSchema,
  visitId: UuidSchema,
  status: PaymentStatusSchema,
  confirmedVia: PaymentConfirmedViaSchema.nullable(),
  statusReason: PaymentStatusReasonSchema.nullable(),
  amount: MoneySchema,
  partNo: z.number().int().positive(),
  partCount: z.number().int().positive(),
});

export type PaymentStatusChangedPayload = z.infer<typeof PaymentStatusChangedPayloadSchema>;
