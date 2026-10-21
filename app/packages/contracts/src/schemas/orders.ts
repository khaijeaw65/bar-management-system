import { z } from 'zod';
import { IsoDateTimeSchema, MoneySchema, UuidSchema } from './common.js';
import { KitchenStationSchema, OrderStatusSchema, TableSeatKindSchema } from './enums.js';
import { UnavailableReasonSchema } from './menu.js';

export const StaffRefSchema = z.object({
  staffId: UuidSchema,
  displayName: z.string(),
});

export type StaffRef = z.infer<typeof StaffRefSchema>;

export const OrderItemModifierSchema = z.object({
  optionId: UuidSchema,
  name: z.string(),
  priceDelta: MoneySchema,
});

export type OrderItemModifier = z.infer<typeof OrderItemModifierSchema>;

export const LineCancellationSchema = z.object({
  at: IsoDateTimeSchema,
  reason: z.string().nullable(),
  by: StaffRefSchema.nullable(),
  system: z.boolean(),
});

export type LineCancellation = z.infer<typeof LineCancellationSchema>;

export const OrderLineSchema = z.object({
  id: UuidSchema,
  variantId: UuidSchema,
  name: z.string(),
  variantName: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: MoneySchema,
  modifiers: z.array(OrderItemModifierSchema),
  lineTotal: MoneySchema,
  orderedByName: z.string().nullable(),
  notes: z.string().nullable(),
  cancelledAt: IsoDateTimeSchema.nullable(),
  cancellation: LineCancellationSchema.nullable(),
});

export type OrderLine = z.infer<typeof OrderLineSchema>;

export const TicketIssueReasonSchema = z.enum(
  ['out_of_stock', 'equipment', 'other'],
  'เหตุผลไม่ถูกต้อง',
);

export type TicketIssueReason = z.infer<typeof TicketIssueReasonSchema>;

export const TicketIssueSchema = z.object({
  reason: TicketIssueReasonSchema,
  itemId: UuidSchema.nullable(),
  note: z.string().nullable(),
  reportedBy: StaffRefSchema,
  escalatedAt: IsoDateTimeSchema.nullable(),
});

export type TicketIssue = z.infer<typeof TicketIssueSchema>;

export const TicketSchema = z.object({
  id: UuidSchema,
  orderId: UuidSchema,
  orderNumber: z.number().int().positive(),
  station: KitchenStationSchema.nullable(),
  status: OrderStatusSchema,
  seat: z.object({
    id: UuidSchema,
    label: z.string(),
    kind: TableSeatKindSchema,
  }),
  items: z.array(OrderLineSchema),
  issue: TicketIssueSchema.nullable(),
  acceptedBy: StaffRefSchema.nullable(),
  sentAt: IsoDateTimeSchema.nullable(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export type Ticket = z.infer<typeof TicketSchema>;

export const OrderSchema = z.object({
  id: UuidSchema,
  visitId: UuidSchema,
  orderNumber: z.number().int().positive(),
  businessDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  createdAt: IsoDateTimeSchema,
  createdBy: StaffRefSchema.nullable(),
  tickets: z.array(TicketSchema),
  total: MoneySchema,
});

export type Order = z.infer<typeof OrderSchema>;

export const TicketListSchema = z.object({
  items: z.array(TicketSchema),
});

export type TicketList = z.infer<typeof TicketListSchema>;

const lineLimit = 'สั่งได้ไม่เกิน 50 รายการ';

export const PlaceOrderItemSchema = z.object({
  variantId: UuidSchema,
  quantity: z
    .number('จำนวนไม่ถูกต้อง')
    .int('จำนวนไม่ถูกต้อง')
    .min(1, 'จำนวนอย่างน้อย 1')
    .max(99, 'จำนวนมากเกินไป'),
  modifierOptionIds: z.array(UuidSchema).max(30).optional(),
  orderedByName: z.string().max(100, 'ชื่อยาวเกินไป').nullish(),
  notes: z.string().max(500, 'โน้ตยาวเกินไป').nullish(),
});

export const PlaceOrderRequestSchema = z.object({
  items: z.array(PlaceOrderItemSchema).min(1, 'ต้องมีอย่างน้อย 1 รายการ').max(50, lineLimit),
});

export type PlaceOrderRequest = z.infer<typeof PlaceOrderRequestSchema>;

export const TicketListQuerySchema = z.object({
  status: z.string().optional(),
  visitId: UuidSchema.optional(),
  escalated: z.literal('true', 'ใช้ได้เฉพาะ escalated=true').optional(),
});

export type TicketListQuery = z.infer<typeof TicketListQuerySchema>;

export const FlagIssueRequestSchema = z
  .object({
    reason: TicketIssueReasonSchema,
    itemId: UuidSchema.optional(),
    note: z.string().max(500, 'โน้ตยาวเกินไป').optional(),
  })
  .superRefine((value, ctx) => {
    if (value.reason === 'other' && !value.note?.trim()) {
      ctx.addIssue({ code: 'custom', message: 'ต้องระบุหมายเหตุ', path: ['note'] });
    }
  });

export type FlagIssueRequest = z.infer<typeof FlagIssueRequestSchema>;

export const ResolveIssueRequestSchema = z.object({
  resolution: z.enum(['substitute', 'escalate'], 'วิธีแก้ไม่ถูกต้อง'),
  note: z.string().max(500, 'โน้ตยาวเกินไป').optional(),
});

export type ResolveIssueRequest = z.infer<typeof ResolveIssueRequestSchema>;

export const UnavailableLineSchema = z.object({
  variantId: UuidSchema,
  reason: UnavailableReasonSchema,
});

export type UnavailableLine = z.infer<typeof UnavailableLineSchema>;
