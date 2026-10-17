import { z } from 'zod';
import { UuidSchema } from '../schemas/common.js';
import { VisitStateSchema } from '../schemas/enums.js';
import { TableSummarySchema } from '../schemas/visits.js';

export const VISIT_OPENED = 'visit.opened';
export const VISIT_STATE_CHANGED = 'visit.state_changed';

// Payload of visit.opened: the table summary of that seat.
export const VisitOpenedPayloadSchema = TableSummarySchema;
export type VisitOpenedPayload = z.infer<typeof VisitOpenedPayloadSchema>;

export const VisitStateChangedPayloadSchema = z.object({
  visitId: UuidSchema,
  tableSeatId: UuidSchema,
  state: VisitStateSchema,
});

export type VisitStateChangedPayload = z.infer<
  typeof VisitStateChangedPayloadSchema
>;
