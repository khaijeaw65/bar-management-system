import { z } from 'zod';
import { UuidSchema } from '../schemas/common.js';
import { AvailabilityTicketSchema, NotVoidedTicketSchema } from '../schemas/menu.js';

export const MENU_AVAILABILITY_CHANGED = 'menu.availability_changed';

export const MenuAvailabilityChangedPayloadSchema = z.object({
  menuItemId: UuidSchema,
  name: z.string(),
  isAvailable: z.boolean(),
  autoVoided: z.array(AvailabilityTicketSchema),
  notVoided: z.array(NotVoidedTicketSchema),
});

export type MenuAvailabilityChangedPayload = z.infer<typeof MenuAvailabilityChangedPayloadSchema>;
