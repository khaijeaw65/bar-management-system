import { z } from 'zod';
import { OrderStatusSchema } from '../schemas/enums.js';
import { UuidSchema } from '../schemas/common.js';
import { OrderSchema, StaffRefSchema } from '../schemas/orders.js';

export const ORDER_CREATED = 'order.created';
export const TICKET_STATUS_CHANGED = 'ticket.status_changed';

export const OrderCreatedPayloadSchema = OrderSchema;
export type OrderCreatedPayload = z.infer<typeof OrderCreatedPayloadSchema>;

export const TicketStatusChangedPayloadSchema = z.object({
  ticketId: UuidSchema,
  orderId: UuidSchema,
  visitId: UuidSchema,
  status: OrderStatusSchema,
  updatedBy: StaffRefSchema,
});

export type TicketStatusChangedPayload = z.infer<
  typeof TicketStatusChangedPayloadSchema
>;
