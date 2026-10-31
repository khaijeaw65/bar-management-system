import { describe, expect, it } from 'vitest';
import {
  NOTIFICATION_NEW,
  NotificationPageSchema,
  NotificationSchema,
  NotificationTypeSchema,
  UnreadCountSchema,
} from '../index.js';

describe('notification schemas and events', () => {
  const validNotification = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    recipientId: '123e4567-e89b-12d3-a456-426614174001',
    type: 'order_new',
    title: 'ออเดอร์ใหม่ · T1',
    body: '2 รายการ',
    refType: 'order',
    refId: '123e4567-e89b-12d3-a456-426614174002',
    readAt: null,
    createdAt: '2026-10-31T12:00:00Z',
  };

  it('validates a correct notification', () => {
    const parsed = NotificationSchema.safeParse(validNotification);
    expect(parsed.success).toBe(true);
  });

  it('validates NotificationTypeSchema with all expected types', () => {
    expect(NotificationTypeSchema.safeParse('order_new').success).toBe(true);
    expect(NotificationTypeSchema.safeParse('call_staff').success).toBe(true);
    expect(NotificationTypeSchema.safeParse('food_ready').success).toBe(true);
    expect(NotificationTypeSchema.safeParse('table_idle').success).toBe(true);
    expect(NotificationTypeSchema.safeParse('invalid_type').success).toBe(false);
  });

  it('validates NotificationPageSchema', () => {
    const page = {
      items: [validNotification],
      nextCursor: 'ey...",',
    };
    expect(NotificationPageSchema.safeParse(page).success).toBe(true);
  });

  it('validates UnreadCountSchema', () => {
    expect(UnreadCountSchema.safeParse({ count: 5 }).success).toBe(true);
    expect(UnreadCountSchema.safeParse({ count: -1 }).success).toBe(false);
    expect(UnreadCountSchema.safeParse({ count: 1.5 }).success).toBe(false);
  });

  it('exports the NOTIFICATION_NEW event string', () => {
    expect(NOTIFICATION_NEW).toBe('notification:new');
  });
});
