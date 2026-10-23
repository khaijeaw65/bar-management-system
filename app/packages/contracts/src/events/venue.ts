import { z } from 'zod';
import { IsoDateTimeSchema } from '../schemas/common.js';
import { VenueSettingsSchema } from '../schemas/menu.js';

export const VENUE_SETTINGS_CHANGED = 'venue.settings_changed';

export const VenueSettingsChangedPayloadSchema = z.object({
  settings: VenueSettingsSchema,
  updatedAt: IsoDateTimeSchema,
});
export type VenueSettingsChangedPayload = z.infer<typeof VenueSettingsChangedPayloadSchema>;
