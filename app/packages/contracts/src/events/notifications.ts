import { NotificationSchema, type Notification } from '../schemas/notifications.js';

export const NOTIFICATION_NEW = 'notification:new';

export const NotificationNewPayloadSchema = NotificationSchema;
export type NotificationNewPayload = Notification;
