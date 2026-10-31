import type { NotificationType } from '@bar/contracts';

export interface NewNotificationRow {
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string | null;
  refType: string | null;
  refId: string | null;
  readAt: Date | null;
}

export interface NotificationRecord {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string | null;
  refType: string | null;
  refId: string | null;
  readAt: Date | null;
  createdAt: Date;
}

export abstract class NotificationRepository {
  public abstract insertMany(rows: NewNotificationRow[]): Promise<NotificationRecord[]>;
  public abstract findPage(
    recipientId: string,
    cursorId: string | null,
    limit: number,
  ): Promise<NotificationRecord[]>;
  public abstract countUnread(recipientId: string): Promise<number>;
  public abstract findByIdAndRecipient(
    id: string,
    recipientId: string,
  ): Promise<NotificationRecord | null>;
  public abstract markRead(item: NotificationRecord, readAt: Date): Promise<NotificationRecord>;
  public abstract markAllRead(recipientId: string, readAt: Date): Promise<number>;
}

export { NotificationRepository as INotificationRepository };
