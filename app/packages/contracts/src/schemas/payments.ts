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
  slipTransRef: z.string().nullable(),
  slipAmount: MoneySchema.nullable(),
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

const MAX_SLIP_BYTES = 1_048_576;
// base64 of a 1MB image is ~4/3; anything longer cannot be a legal image.
const MAX_SLIP_BASE64 = Math.ceil((MAX_SLIP_BYTES + 2) / 3) * 4;

export const VerifySlipSchema = z
  .object({
    payload: z.string().min(1).max(128).optional(),
    image: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    const hasPayload = value.payload !== undefined;
    const hasImage = value.image !== undefined;
    if (hasPayload === hasImage) {
      ctx.addIssue({ code: 'custom', message: 'ต้องส่ง payload หรือรูปอย่างใดอย่างหนึ่ง' });
      return;
    }
    if (!hasImage || value.image === undefined) return;
    const problem = slipImageProblem(value.image);
    if (!problem) return;
    ctx.addIssue({ code: 'custom', message: problem, path: ['image'] });
  });
export type VerifySlip = z.infer<typeof VerifySlipSchema>;

function slipImageProblem(value: string): string | null {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length % 4 !== 0) {
    return 'รองรับเฉพาะ JPEG หรือ PNG';
  }
  if (value.length > MAX_SLIP_BASE64) return 'รูปใหญ่เกิน 1 MB';
  const bytes = decodeSlip(value);
  if (!bytes) return 'รองรับเฉพาะ JPEG หรือ PNG';
  if (bytes.length > MAX_SLIP_BYTES) return 'รูปใหญ่เกิน 1 MB';
  if (isJpeg(bytes) || isPng(bytes)) return null;
  return 'รองรับเฉพาะ JPEG หรือ PNG';
}

function decodeSlip(value: string): Uint8Array | null {
  try {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

function isPng(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  );
}
