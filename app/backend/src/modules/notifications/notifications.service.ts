import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import {
  NOTIFICATION_NEW,
  type Notification,
  type NotificationPage,
  type NotificationType,
  UuidSchema,
} from '@bar/contracts';
import { CLOCK, type Clock } from '../../common/clock.js';
import { DomainException } from '../../common/domain-exception.js';
import { NotificationEntity } from './infrastructure/persistence/notification.entity.js';
import { NotificationsGateway } from './notifications.gateway.js';
import type { NotifyInput } from './notifications.types.js';

/** The guest socket lives in the Customer module; it registers here so Notifications never imports it. */
export type TabChangedSink = (visitId: string, sessionEnded: boolean) => void;

export type SeatVisitOpenedSink = (tableSeatId: string, visitId: string) => void;

const PAGE_SIZE = 20;

@Injectable()
export class NotificationsService {
  private tabSink: TabChangedSink | null = null;
  private seatSink: SeatVisitOpenedSink | null = null;

  public constructor(
    @InjectRepository(NotificationEntity)
    private readonly repo: Repository<NotificationEntity>,
    private readonly notificationsGateway: NotificationsGateway,
    @Inject(CLOCK) private readonly clock: Clock,
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
   * Persists notifications for recipients and emits live `notification:new` to each recipient room.
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
    return this.broadcastNotifications(saved);
  }

  public async feed(
    recipientId: string,
    cursor?: string,
  ): Promise<NotificationPage> {
    const rows = await this.queryFeedPage(recipientId, cursor);
    return this.buildFeedPage(rows);
  }

  public async unreadCount(recipientId: string): Promise<number> {
    return await this.repo.count({
      where: { recipientId, readAt: IsNull() },
    });
  }

  public async markAsRead(recipientId: string, id: string): Promise<Notification> {
    const item = await this.findRecipientNotification(recipientId, id);
    const updated = await this.persistReadTimestamp(item);
    return this.serialize(updated);
  }

  public async markAllAsRead(recipientId: string): Promise<number> {
    const result = await this.repo
      .createQueryBuilder()
      .update(NotificationEntity)
      .set({ readAt: this.clock.now() })
      .where('recipient_id = :recipientId AND read_at IS NULL', { recipientId })
      .execute();
    return result.affected ?? 0;
  }

  private async insertRows(
    type: NotificationType,
    recipientIds: string[],
    payload: NotifyInput,
  ): Promise<NotificationEntity[]> {
    const entities = recipientIds.map((recipientId) =>
      this.repo.create({
        recipientId,
        type,
        title: payload.title,
        body: payload.body ?? null,
        refType: payload.refType ?? null,
        refId: payload.refId ?? null,
        readAt: null,
      }),
    );
    return await this.repo.save(entities);
  }

  private broadcastNotifications(items: NotificationEntity[]): Notification[] {
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
  ): Promise<NotificationEntity[]> {
    const cursorId = this.parseCursor(cursor);
    const qb = this.repo
      .createQueryBuilder('n')
      .where('n.recipient_id = :recipientId', { recipientId })
      .orderBy('n.created_at', 'DESC')
      .addOrderBy('n.id', 'DESC')
      .take(PAGE_SIZE + 1);

    if (cursorId) {
      qb.andWhere(
        '(n.created_at, n.id) < (SELECT sub.created_at, sub.id FROM notification sub WHERE sub.id = :cursorId)',
        { cursorId },
      );
    }
    return await qb.getMany();
  }

  private buildFeedPage(rows: NotificationEntity[]): NotificationPage {
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
  ): Promise<NotificationEntity> {
    const item = await this.repo.findOne({ where: { id, recipientId } });
    if (!item) {
      throw new DomainException('NOT_FOUND', 'ไม่พบการแจ้งเตือน', 404);
    }
    return item;
  }

  private async persistReadTimestamp(
    item: NotificationEntity,
  ): Promise<NotificationEntity> {
    if (item.readAt !== null) {
      return item;
    }
    item.readAt = this.clock.now();
    return await this.repo.save(item);
  }

  private serialize(entity: NotificationEntity): Notification {
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

  private createCursor(item: NotificationEntity): string {
    return item.id;
  }
}
