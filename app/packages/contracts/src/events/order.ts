import { z } from 'zod';
import { OrderStatusSchema } from '../schemas/enums.js';
import { IsoDateTimeSchema, UuidSchema } from '../schemas/common.js';
import { OrderSchema, StaffRefSchema, TicketIssueReasonSchema } from '../schemas/orders.js';

export const ORDER_CREATED = 'order.created';
export const TICKET_STATUS_CHANGED = 'ticket.status_changed';
export const TICKET_ISSUE_ESCALATED = 'ticket.issue_escalated';

export const OrderCreatedPayloadSchema = OrderSchema;
export type OrderCreatedPayload = z.infer<typeof OrderCreatedPayloadSchema>;

export const TicketStatusChangedPayloadSchema = z.object({
  ticketId: UuidSchema,
  orderId: UuidSchema,
  visitId: UuidSchema,
  status: OrderStatusSchema,
  updatedAt: IsoDateTimeSchema,
  updatedBy: StaffRefSchema,
});

export type TicketStatusChangedPayload = z.infer<
  typeof TicketStatusChangedPayloadSchema
>;

export const TicketIssueEscalatedPayloadSchema = z.object({
  ticketId: UuidSchema,
  orderId: UuidSchema,
  visitId: UuidSchema,
  orderNumber: z.number().int().positive(),
  seatLabel: z.string(),
  reason: TicketIssueReasonSchema,
  escalatedAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
  escalatedBy: StaffRefSchema,
});

export type TicketIssueEscalatedPayload = z.infer<typeof TicketIssueEscalatedPayloadSchema>;
