import { z } from 'zod';
import { IsoDateTimeSchema, UuidSchema } from '../schemas/common.js';
import { StaffRefSchema } from '../schemas/orders.js';
import { CallStaffReasonSchema } from '../schemas/visits.js';

export const TABLE_STAFF_CALLED = 'table.staff_called';
export const TABLE_STAFF_CALL_CLEARED = 'table.staff_call_cleared';
export const TABLES_CHANGED = 'tables.changed';

export const TableStaffCalledPayloadSchema = z.object({
  tableSeatId: UuidSchema,
  reason: CallStaffReasonSchema.nullable(),
  note: z.string().nullable(),
  calledAt: IsoDateTimeSchema,
});
export type TableStaffCalledPayload = z.infer<typeof TableStaffCalledPayloadSchema>;

export const TableStaffCallClearedPayloadSchema = z.object({
  tableSeatId: UuidSchema,
  acknowledgedBy: StaffRefSchema.nullable(),
});
export type TableStaffCallClearedPayload = z.infer<typeof TableStaffCallClearedPayloadSchema>;

export const TablesChangedPayloadSchema = z.object({
  seatIds: z.array(UuidSchema),
});
export type TablesChangedPayload = z.infer<typeof TablesChangedPayloadSchema>;
