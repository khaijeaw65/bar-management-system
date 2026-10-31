import { z } from 'zod';
import { IsoDateTimeSchema, UuidSchema } from './common.js';
import { NotificationTypeSchema } from './enums.js';

export { NotificationTypeSchema, type NotificationType } from './enums.js';

export const NotificationSchema = z.object({
  id: UuidSchema,
  recipientId: UuidSchema,
  type: NotificationTypeSchema,
  title: z.string(),
  body: z.string().nullable(),
  refType: z.string().nullable(),
  refId: UuidSchema.nullable(),
  readAt: IsoDateTimeSchema.nullable(),
  createdAt: IsoDateTimeSchema,
});
export type Notification = z.infer<typeof NotificationSchema>;

export const NotificationPageSchema = z.object({
  items: z.array(NotificationSchema),
  nextCursor: z.string().nullable(),
});
export type NotificationPage = z.infer<typeof NotificationPageSchema>;

export const UnreadCountSchema = z.object({
  count: z.number().int().nonnegative(),
});
export type UnreadCount = z.infer<typeof UnreadCountSchema>;

export const ReadAllResultSchema = z.object({
  updated: z.number().int().nonnegative(),
});
export type ReadAllResult = z.infer<typeof ReadAllResultSchema>;

export const PushPlatformSchema = z.enum(['ios', 'android']);
export type PushPlatform = z.infer<typeof PushPlatformSchema>;

export const RegisterPushTokenSchema = z.object({
  token: z.string().min(1).max(255),
  platform: PushPlatformSchema,
});
export type RegisterPushToken = z.infer<typeof RegisterPushTokenSchema>;
