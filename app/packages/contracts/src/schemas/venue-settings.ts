import { z } from 'zod';

const cutoffMessage = 'เวลาตัดวันต้องเป็นรูปแบบ HH:MM (00:00–23:59)';

export const UpdateVenueSettingsSchema = z
  .object({
    name: z.string().trim().min(1, 'กรุณากรอกชื่อร้าน').max(200, 'ชื่อร้านยาวเกิน 200 ตัวอักษร'),
    businessDayCutoff: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, cutoffMessage),
    kitchenDisplayEnabled: z.boolean(),
    counterQrEnabled: z.boolean(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'ต้องระบุอย่างน้อยหนึ่งค่า');
export type UpdateVenueSettings = z.infer<typeof UpdateVenueSettingsSchema>;
