import { z } from 'zod';
import { IsoDateTimeSchema, MoneySchema, UuidSchema } from './common.js';
import {
  TableSeatKindSchema,
  VisitOpenSourceSchema,
  VisitStateSchema,
} from './enums.js';
import { OrderSchema } from './orders.js';
import { BillSchema, PaymentAttemptSchema } from './payments.js';

// Card on GET /tables. staffCalled mirrors the seat's bell (BRIEF-048).
export const CurrentVisitSchema = z.object({
  id: UuidSchema,
  state: VisitStateSchema,
  openedAt: IsoDateTimeSchema,
  guestLabel: z.string().nullable(),
  total: MoneySchema,
  itemCount: z.number().int().nonnegative(),
  staffCalled: z.boolean(),
  paymentPending: z.boolean(),
});

export type CurrentVisit = z.infer<typeof CurrentVisitSchema>;

// The bell lives on the seat so a guest at a free table can ring it too (BRIEF-048).
// `transfer` (BRIEF-052) is set only by notify-transfer, never by a guest's call-staff body.
export const CallStaffReasonSchema = z.enum(['bill', 'other', 'transfer'], 'เหตุผลไม่ถูกต้อง');
export type CallStaffReason = z.infer<typeof CallStaffReasonSchema>;

export const StaffCallSchema = z.object({
  reason: CallStaffReasonSchema.nullable(),
  note: z.string().nullable(),
  calledAt: IsoDateTimeSchema,
});
export type StaffCall = z.infer<typeof StaffCallSchema>;

export const TableSummarySchema = z.object({
  id: UuidSchema,
  label: z.string(),
  kind: TableSeatKindSchema,
  sortOrder: z.number().int(),
  currentVisit: CurrentVisitSchema.nullable(),
  staffCall: StaffCallSchema.nullable(),
});

export type TableSummary = z.infer<typeof TableSummarySchema>;

export const TableListSchema = z.object({
  items: z.array(TableSummarySchema),
});

export type TableList = z.infer<typeof TableListSchema>;

export const VisitOpenerSchema = z.object({
  staffId: UuidSchema,
  displayName: z.string(),
});

export type VisitOpener = z.infer<typeof VisitOpenerSchema>;

export const VisitSchema = z.object({
  id: UuidSchema,
  tableSeatId: UuidSchema,
  seatLabel: z.string(),
  seatKind: TableSeatKindSchema,
  state: VisitStateSchema,
  openedAt: IsoDateTimeSchema,
  closedAt: IsoDateTimeSchema.nullable(),
  guestLabel: z.string().nullable(),
  openedBy: VisitOpenerSchema.nullable(),
  openedVia: VisitOpenSourceSchema,
});

export type Visit = z.infer<typeof VisitSchema>;

export const VisitDetailSchema = VisitSchema.extend({
  orders: z.array(OrderSchema),
  bill: BillSchema,
  payments: z.array(PaymentAttemptSchema),
});

export type VisitDetail = z.infer<typeof VisitDetailSchema>;

// Staff open only. `qr` is set by the later customer QR route, not this body.
export const StaffOpenViaSchema = z.enum(
  ['pos', 'app'],
  'ช่องทางเปิดโต๊ะไม่ถูกต้อง',
);

export type StaffOpenVia = z.infer<typeof StaffOpenViaSchema>;

export const OpenVisitRequestSchema = z.object({
  tableSeatId: UuidSchema,
  guestLabel: z.string().max(100, 'ชื่อแขกยาวเกินไป').nullish(),
  via: StaffOpenViaSchema.optional(),
});

export type OpenVisitRequest = z.infer<typeof OpenVisitRequestSchema>;

export const OpenVisitResponseSchema = z.object({
  visit: VisitSchema,
  attached: z.boolean(),
});

export type OpenVisitResponse = z.infer<typeof OpenVisitResponseSchema>;

export const RegenerateQrResponseSchema = z.object({
  qrToken: z.string().min(1),
});

export type RegenerateQrResponse = z.infer<typeof RegenerateQrResponseSchema>;
