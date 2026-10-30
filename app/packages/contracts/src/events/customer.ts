import { z } from 'zod';
import { UuidSchema } from '../schemas/common.js';

// The only event on the guest socket `/customer` — a ping, the phone refetches `GET /customer/tab` (BRIEF-048).
export const TAB_CHANGED = 'tab.changed';

export const TabChangedPayloadSchema = z.object({
  visitId: UuidSchema,
  sessionEnded: z.boolean().optional(),
});

export type TabChangedPayload = z.infer<typeof TabChangedPayloadSchema>;
