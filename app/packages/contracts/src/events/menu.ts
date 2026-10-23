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

// Every menu write (BRIEF-038) → POS / staff app refetch the menu. Mark-(un)available keeps the event above.
export const MENU_CHANGED = 'menu.changed';

export const MenuChangedPayloadSchema = z.object({
  itemIds: z.array(UuidSchema).optional(),
  categoryIds: z.array(UuidSchema).optional(),
});

export type MenuChangedPayload = z.infer<typeof MenuChangedPayloadSchema>;
