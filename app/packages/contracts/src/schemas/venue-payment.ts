import { z } from 'zod';
import { PromptpayIdTypeSchema, VenuePaymentModeSchema } from './enums.js';

const invalidId = 'รูปแบบพร้อมเพย์ไม่ถูกต้อง';

export const VenuePaymentSettingsSchema = z.object({
  paymentMode: VenuePaymentModeSchema,
  promptpayIdType: PromptpayIdTypeSchema.nullable(),
  promptpayIdMasked: z.string().regex(/^XXX-XXX-\d{4}$/).nullable(),
});
export type VenuePaymentSettings = z.infer<typeof VenuePaymentSettingsSchema>;

export const UpdateVenuePaymentSettingsSchema = z.object({
  promptpayId: z.string(invalidId).min(1, invalidId),
  promptpayIdType: PromptpayIdTypeSchema,
});
export type UpdateVenuePaymentSettings = z.infer<typeof UpdateVenuePaymentSettingsSchema>;
