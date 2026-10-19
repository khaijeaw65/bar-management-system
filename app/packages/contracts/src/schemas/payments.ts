import { z } from 'zod';
import { IsoDateTimeSchema, MoneySchema, UuidSchema } from './common.js';
import {
  PaymentConfirmedViaSchema,
  PaymentMethodSchema,
  PaymentStatusReasonSchema,
  PaymentStatusSchema,
} from './enums.js';

export const PaymentModeSchema = z.enum(['merge'], 'รูปแบบการชำระไม่ถูกต้อง');
export type PaymentMode = z.infer<typeof PaymentModeSchema>;

export const ManualConfirmReasonSchema = z.enum([
  'webhook_missing',
  'direct_transfer',
  'other',
]);
export type ManualConfirmReason = z.infer<typeof ManualConfirmReasonSchema>;

export const PaymentSchema = z.object({
  id: UuidSchema,
  attemptId: UuidSchema,
  visitId: UuidSchema,
  partNo: z.number().int().positive(),
  partCount: z.number().int().positive(),
  amount: MoneySchema,
  method: PaymentMethodSchema,
  status: PaymentStatusSchema,
  confirmedVia: PaymentConfirmedViaSchema.nullable(),
  statusReason: PaymentStatusReasonSchema.nullable(),
  statusNote: z.string().nullable(),
  qrPayload: z.string().nullable(),
  expiresAt: IsoDateTimeSchema.nullable(),
  paidAt: IsoDateTimeSchema.nullable(),
  createdBy: UuidSchema.nullable(),
  updatedBy: UuidSchema.nullable(),
  createdAt: IsoDateTimeSchema,
});
export type Payment = z.infer<typeof PaymentSchema>;

export const PaymentAttemptSchema = z.object({
  attemptId: UuidSchema,
  visitId: UuidSchema,
  mode: PaymentModeSchema,
  total: MoneySchema,
  parts: z.array(PaymentSchema),
});
export type PaymentAttempt = z.infer<typeof PaymentAttemptSchema>;

export const BillSchema = z.object({
  total: MoneySchema,
  paid: MoneySchema,
  remaining: MoneySchema,
  locked: z.boolean(),
});
export type Bill = z.infer<typeof BillSchema>;

export const CreatePaymentSchema = z.object({
  method: PaymentMethodSchema,
  mode: PaymentModeSchema,
});
export type CreatePayment = z.infer<typeof CreatePaymentSchema>;

export const MarkPaidSchema = z
  .object({
    via: z.enum(['manual', 'cash'], 'วิธียืนยันไม่ถูกต้อง'),
    reason: ManualConfirmReasonSchema.optional(),
    note: z.string().max(500).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.via !== 'manual') return;
    if (!value.reason) {
      ctx.addIssue({ code: 'custom', message: 'ต้องระบุเหตุผล', path: ['reason'] });
      return;
    }
    if (value.reason === 'other' && !value.note?.trim()) {
      ctx.addIssue({ code: 'custom', message: 'ต้องระบุหมายเหตุ', path: ['note'] });
    }
  });
export type MarkPaid = z.infer<typeof MarkPaidSchema>;
