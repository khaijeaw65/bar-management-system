import { z } from 'zod';
import { IsoDateTimeSchema, MoneySchema, UuidSchema } from './common.js';
import {
  TableSeatKindSchema,
  VisitOpenSourceSchema,
  VisitStateSchema,
} from './enums.js';

// Card on GET /tables. total, itemCount, and staffCalled stay empty until
// BRIEF-012, BRIEF-013, and the customer QR brief fill them.
export const CurrentVisitSchema = z.object({
  id: UuidSchema,
  state: VisitStateSchema,
  openedAt: IsoDateTimeSchema,
  guestLabel: z.string().nullable(),
  total: MoneySchema,
  itemCount: z.number().int().nonnegative(),
  staffCalled: z.boolean(),
});

export type CurrentVisit = z.infer<typeof CurrentVisitSchema>;

export const TableSummarySchema = z.object({
  id: UuidSchema,
  label: z.string(),
  kind: TableSeatKindSchema,
  sortOrder: z.number().int(),
  currentVisit: CurrentVisitSchema.nullable(),
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

// Staff open only. `qr` is set by the later customer QR route, not this body.
export const OpenVisitRequestSchema = z.object({
  tableSeatId: UuidSchema,
  guestLabel: z.string().max(100, 'ชื่อแขกยาวเกินไป').nullish(),
  via: z.enum(['pos', 'app'], 'ช่องทางเปิดโต๊ะไม่ถูกต้อง').optional(),
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
