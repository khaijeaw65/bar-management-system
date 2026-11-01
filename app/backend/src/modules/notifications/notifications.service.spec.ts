import { describe, expect, it, vi } from 'vitest';
import { NOTIFICATION_NEW } from '@bar/contracts';
import type { Clock } from '../../common/clock.js';
import type {
  NewNotificationRow,
  NotificationRecord,
  NotificationRepository,
} from './domain/ports/notification.repository.port.js';
import type { NotificationsGateway } from './notifications.gateway.js';
import type { PushDeliveryService } from './application/push-delivery.service.js';
import { NotificationsService } from './notifications.service.js';

describe('NotificationsService', () => {
  const fixedNow = new Date('2026-10-31T12:00:00.000Z');
  const clock: Clock = { now: () => fixedNow };

  const createService = () => {
    const savedEntities: NotificationRecord[] = [];

    const repo: NotificationRepository = {
      insertMany: vi.fn(async (rows: NewNotificationRow[]) => {
        const created = rows.map((row, index) => ({
          id: `notif-${index + 1}`,
          createdAt: fixedNow,
          ...row,
        }));
        savedEntities.push(...created);
        return created;
      }),
      findPage: vi.fn(async () => []),
      countUnread: vi.fn(async () => 3),
      findByIdAndRecipient: vi.fn(async () => null),
      markRead: vi.fn(async (item: NotificationRecord, readAt: Date) => {
        item.readAt = readAt;
        return item;
      }),
      markAllRead: vi.fn(async () => 0),
    };

    const gateway = {
      emitToPos: vi.fn(),
      emitToStaff: vi.fn(),
      emitToUser: vi.fn(),
    } as unknown as NotificationsGateway;

    const pushDelivery = { enqueue: vi.fn(async () => undefined) } as unknown as PushDeliveryService;

    const service = new NotificationsService(repo, gateway, clock, pushDelivery);

    return { service, repo, gateway, pushDelivery };
  };

  it('notify inserts rows for each recipient and emits notification:new to each user room', async () => {
    const { service, gateway, repo, pushDelivery } = createService();

    const result = await service.notify(
      'order_new',
      ['user-1', 'user-2'],
      {
        title: 'ออเดอร์ใหม่ · T1',
        body: '3 รายการ',
        refType: 'order',
        refId: '123e4567-e89b-12d3-a456-426614174000',
      },
    );

    expect(result).toHaveLength(2);
    expect(result[0]?.createdAt).toBe(fixedNow.toISOString());
    expect(repo.insertMany).toHaveBeenCalledTimes(1);
    expect(gateway.emitToUser).toHaveBeenCalledTimes(2);
    expect(pushDelivery.enqueue).toHaveBeenCalledWith(result);
    expect(gateway.emitToUser).toHaveBeenCalledWith(
      'user-1',
      NOTIFICATION_NEW,
      expect.objectContaining({
        recipientId: 'user-1',
        type: 'order_new',
        title: 'ออเดอร์ใหม่ · T1',
      }),
    );
    expect(gateway.emitToUser).toHaveBeenCalledWith(
      'user-2',
      NOTIFICATION_NEW,
      expect.objectContaining({
        recipientId: 'user-2',
        type: 'order_new',
      }),
    );
  });

  it('notify returns empty array and emits nothing when recipients list is empty', async () => {
    const { service, gateway, repo, pushDelivery } = createService();

    const result = await service.notify('call_staff', [], {
      title: 'T1 เรียกพนักงาน',
    });

    expect(result).toEqual([]);
    expect(repo.insertMany).not.toHaveBeenCalled();
    expect(gateway.emitToUser).not.toHaveBeenCalled();
    expect(pushDelivery.enqueue).not.toHaveBeenCalled();
  });

  it('unreadCount queries repository count for unread rows', async () => {
    const { service, repo } = createService();

    const count = await service.unreadCount('user-1');
    expect(count).toBe(3);
    expect(repo.countUnread).toHaveBeenCalledWith('user-1');
  });

  it('markAsRead throws 404 DomainException if notification not found or belongs to another user', async () => {
    const { service, repo } = createService();
    vi.mocked(repo.findByIdAndRecipient).mockResolvedValue(null);

    await expect(service.markAsRead('user-1', 'notif-999')).rejects.toThrow('ไม่พบการแจ้งเตือน');
  });

  it('markAsRead sets readAt timestamp and saves when unread', async () => {
    const { service, repo } = createService();
    const item: NotificationRecord = {
      id: 'notif-1',
      recipientId: 'user-1',
      type: 'order_new',
      title: 'ออเดอร์ใหม่',
      body: null,
      refType: null,
      refId: null,
      readAt: null,
      createdAt: fixedNow,
    };
    vi.mocked(repo.findByIdAndRecipient).mockResolvedValue(item);

    const updated = await service.markAsRead('user-1', 'notif-1');
    expect(item.readAt).toEqual(fixedNow);
    expect(updated.readAt).toBe(fixedNow.toISOString());
    expect(repo.markRead).toHaveBeenCalledWith(item, fixedNow);
  });

  it('feed throws 400 DomainException if cursor is invalid UUID', async () => {
    const { service } = createService();
    await expect(service.feed('user-1', 'invalid-cursor')).rejects.toThrow('cursor ไม่ถูกต้อง');
  });

  it('feed queries repository with cursor and returns items and nextCursor', async () => {
    const { service, repo } = createService();
    const rows = Array.from({ length: 21 }, (_, i) => ({
      id: `123e4567-e89b-42d3-a456-${String(i + 1).padStart(12, '0')}`,
      recipientId: 'user-1',
      type: 'order_new' as const,
      title: `Notif ${i + 1}`,
      body: null,
      refType: null,
      refId: null,
      readAt: null,
      createdAt: fixedNow,
    }));
    vi.mocked(repo.findPage).mockResolvedValue(rows);

    const validCursor = '123e4567-e89b-42d3-a456-426614174099';
    const page = await service.feed('user-1', validCursor);

    expect(repo.findPage).toHaveBeenCalledWith('user-1', validCursor, 21);
    expect(page.items).toHaveLength(20);
    expect(page.nextCursor).toBe(rows[19].id);
  });
});
