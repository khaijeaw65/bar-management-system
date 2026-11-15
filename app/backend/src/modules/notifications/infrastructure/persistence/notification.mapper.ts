import type { NotificationRecord } from '../../domain/ports/notification.repository.port.js';
import type { NotificationEntity } from './notification.entity.js';

export function toNotificationRecord(entity: NotificationEntity): NotificationRecord {
  return {
    id: entity.id,
    recipientId: entity.recipientId,
    type: entity.type,
    title: entity.title,
    body: entity.body,
    refType: entity.refType,
    refId: entity.refId,
    readAt: entity.readAt,
    createdAt: entity.createdAt,
  };
}
