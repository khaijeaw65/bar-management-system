import { Injectable } from '@nestjs/common';
import {
  NOTIFICATION_NEW,
  type Notification,
  type NotificationPage,
  type NotificationType,
  UuidSchema,
} from '@bar/contracts';
import { Clock } from '../../common/clock.js';
import { DomainException } from '../../common/domain-exception.js';
import { PushDeliveryService } from './application/push-delivery.service.js';
import {
  NotificationRepository,
  type NotificationRecord,
} from './domain/ports/notification.repository.port.js';
import { NotificationsGateway } from './notifications.gateway.js';
import type { NotifyInput, SeatVisitOpenedSink, TabChangedSink } from './notifications.types.js';

export type { SeatVisitOpenedSink, TabChangedSink } from './notifications.types.js';

const PAGE_SIZE = 20;

@Injectable()
export class NotificationsService {
  private tabSink: TabChangedSink | null = null;
  private seatSink: SeatVisitOpenedSink | null = null;

  public constructor(
    private readonly repo: NotificationRepository,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly clock: Clock,
    private readonly pushDelivery: PushDeliveryService,
  ) {}

  public emitToPos(event: string, payload: unknown): void {
    this.notificationsGateway.emitToPos(event, payload);
  }

  public emitToStaff(event: string, payload: unknown): void {
    this.notificationsGateway.emitToStaff(event, payload);
  }

  public registerTabSink(sink: TabChangedSink): void {
    this.tabSink = sink;
  }

  public registerSeatSink(sink: SeatVisitOpenedSink): void {
    this.seatSink = sink;
  }

  /** A visit opened on this seat: phones still browsing it bind without waiting for a refetch. */
  public emitSeatVisitOpened(tableSeatId: string, visitId: string): void {
    this.seatSink?.(tableSeatId, visitId);
  }

  /** Ping the phones on this visit (`tab.changed`); they refetch their tab. A failed emit never fails the write. */
  public emitTabChanged(visitId: string, sessionEnded = false): void {
    this.tabSink?.(visitId, sessionEnded);
  }

  /**
   * Persists notifications for recipients and emits live `notification:new` to each recipient room,
   * then queues the phone push (a push failure never touches the saved rows).
   * Returns the created serialized notifications.
   */
  public async notify(
    type: NotificationType,
    recipientIds: string[],
    payload: NotifyInput,
  ): Promise<Notification[]> {
    if (recipientIds.length === 0) {
      return [];
    }
    const saved = await this.insertRows(type, recipientIds, payload);
    const notifications = this.broadcastNotifications(saved);
    await this.pushDelivery.enqueue(notifications);
    return notifications;
  }

  public async feed(
    recipientId: string,
    cursor?: string,
  ): Promise<NotificationPage> {
    const rows = await this.queryFeedPage(recipientId, cursor);
    return this.buildFeedPage(rows);
  }

  public async unreadCount(recipientId: string): Promise<number> {
    return await this.repo.countUnread(recipientId);
  }

  public async markAsRead(recipientId: string, id: string): Promise<Notification> {
    const item = await this.findRecipientNotification(recipientId, id);
    const updated = await this.persistReadTimestamp(item);
    return this.serialize(updated);
  }

  public async markAllAsRead(recipientId: string): Promise<number> {
    return await this.repo.markAllRead(recipientId, this.clock.now());
  }

  private async insertRows(
    type: NotificationType,
    recipientIds: string[],
    payload: NotifyInput,
  ): Promise<NotificationRecord[]> {
    const rows = recipientIds.map((recipientId) => ({
      recipientId,
      type,
      title: payload.title,
      body: payload.body ?? null,
      refType: payload.refType ?? null,
      refId: payload.refId ?? null,
      readAt: null,
    }));
    return await this.repo.insertMany(rows);
  }

  private broadcastNotifications(items: NotificationRecord[]): Notification[] {
    const serialized = items.map((item) => this.serialize(item));
    for (const item of serialized) {
      this.notificationsGateway.emitToUser(
        item.recipientId,
        NOTIFICATION_NEW,
        item,
      );
    }
    return serialized;
  }

  private async queryFeedPage(
    recipientId: string,
    cursor?: string,
  ): Promise<NotificationRecord[]> {
    const cursorId = this.parseCursor(cursor);
    return await this.repo.findPage(recipientId, cursorId, PAGE_SIZE + 1);
  }

  private buildFeedPage(rows: NotificationRecord[]): NotificationPage {
    const hasMore = rows.length > PAGE_SIZE;
    const pageRows = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
    const nextCursor =
      hasMore && pageRows.length > 0
        ? this.createCursor(pageRows.at(-1)!)
        : null;

    return {
      items: pageRows.map((r) => this.serialize(r)),
      nextCursor,
    };
  }

  private async findRecipientNotification(
    recipientId: string,
    id: string,
  ): Promise<NotificationRecord> {
    const item = await this.repo.findByIdAndRecipient(id, recipientId);
    if (!item) {
      throw new DomainException('NOT_FOUND', 'ไม่พบการแจ้งเตือน', 404);
    }
    return item;
  }

  private async persistReadTimestamp(
    item: NotificationRecord,
  ): Promise<NotificationRecord> {
    if (item.readAt !== null) {
      return item;
    }
    return await this.repo.markRead(item, this.clock.now());
  }

  private serialize(entity: NotificationRecord): Notification {
    return {
      id: entity.id,
      recipientId: entity.recipientId,
      type: entity.type,
      title: entity.title,
      body: entity.body,
      refType: entity.refType,
      refId: entity.refId,
      readAt: entity.readAt ? entity.readAt.toISOString() : null,
      createdAt: entity.createdAt.toISOString(),
    };
  }

  private parseCursor(raw?: string): string | null {
    if (!raw) return null;
    const parsed = UuidSchema.safeParse(raw);
    if (!parsed.success) {
      throw new DomainException('VALIDATION_ERROR', 'cursor ไม่ถูกต้อง', 400);
    }
    return parsed.data;
  }

  private createCursor(item: NotificationRecord): string {
    return item.id;
  }
}
