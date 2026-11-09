import { describe, expect, it, vi } from 'vitest';
import { TICKET_STATUS_CHANGED, type AdjustItemRequest, type Order, type OrderLine } from '@bar/contracts';

vi.mock('@nestjs-cls/transactional', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nestjs-cls/transactional')>();
  return {
    ...actual,
    Transactional: () => () => undefined,
  };
});

import type { AuditLogService } from '../../../common/audit/audit-log.service.js';
import type { Clock } from '../../../common/clock.js';
import { DomainException } from '../../../common/domain-exception.js';
import type { StaffUserService } from '../../iam/application/staff-user.service.js';
import type { NotificationsService } from '../../notifications/notifications.service.js';
import type { OrderRepository } from '../domain/order.repository.js';
import type { LockedItemAdjustment } from '../domain/order.types.js';
import type { ApprovalService } from './approval.service.js';
import type { ApprovalOutcome } from './approval.types.js';
import { OrderAdjustmentService } from './order-adjustment.service.js';
import type { OrderQueryService } from './order-query.service.js';

describe('OrderAdjustmentService', () => {
  const fixedNow = new Date('2026-11-01T15:00:00Z');
  const clock: Clock = { now: () => fixedNow };

  function setup(overrides: {
    locked?: LockedItemAdjustment | null;
    paymentStatus?: 'pending' | 'completed' | null;
    approval?: ApprovalOutcome;
    activeCount?: number;
    staffName?: string;
  } = {}) {
    const lockedItem: LockedItemAdjustment = overrides.locked !== undefined ? overrides.locked! : {
      itemId: 'item-1',
      ticketId: 'ticket-1',
      orderId: 'order-1',
      visitId: 'visit-1',
      visitState: 'active',
      cancelledAt: null,
      cancelKind: null,
    };

    const mockAdjustedLine: OrderLine = {
      id: 'item-1',
      variantId: 'var-1',
      name: 'Singha Draft',
      variantName: 'Pint',
      quantity: 1,
      unitPrice: '160.00',
      lineTotal: '0.00',
      orderedByName: 'Table 1',
      notes: null,
      cancelledAt: null,
      modifiers: [],
      cancellation: null,
      comp: {
        reason: 'wrong_order',
        note: null,
        at: fixedNow.toISOString(),
        by: { staffId: 'staff-1', displayName: 'Staff S' },
        approvedBy: { staffId: 'mgr-1', displayName: 'Manager M' },
        selfApproved: false,
      },
    };

    const mockOrder: Order = {
      id: 'order-1',
      visitId: 'visit-1',
      orderNumber: 1,
      businessDate: '2026-11-01',
      createdAt: fixedNow.toISOString(),
      createdBy: null,
      total: '0.00',
      tickets: [
        {
          id: 'ticket-1',
          orderId: 'order-1',
          orderNumber: 1,
          station: 'bar',
          status: 'ready',
          seat: { id: 'seat-1', label: 'T1', kind: 'table' },
          items: [mockAdjustedLine],
          issue: null,
          acceptedBy: null,
          sentAt: fixedNow.toISOString(),
          createdAt: fixedNow.toISOString(),
          updatedAt: fixedNow.toISOString(),
        },
      ],
    };

    const orders = {
      lockItemForAdjustment: vi.fn(async () => overrides.locked !== undefined ? overrides.locked : lockedItem),
      paymentStatusOnVisit: vi.fn(async () => overrides.paymentStatus ?? null),
      adjustLine: vi.fn(async () => undefined),
      countActiveLines: vi.fn(async () => overrides.activeCount ?? 0),
      saveStatus: vi.fn(async () => undefined),
    } as unknown as OrderRepository;

    const approval = {
      resolve: vi.fn(async () => overrides.approval ?? { approvedBy: 'mgr-1', selfApproved: false }),
    } as unknown as ApprovalService;

    const auditLog = {
      record: vi.fn(async () => undefined),
    } as unknown as AuditLogService;

    const query = {
      getById: vi.fn(async () => mockOrder),
    } as unknown as OrderQueryService;

    const notifications = {
      emitToPos: vi.fn(),
      emitTabChanged: vi.fn(),
    } as unknown as NotificationsService;

    const staff = {
      findActiveById: vi.fn(async (id: string) => ({
        id,
        displayName: overrides.staffName ?? 'Staff S',
        active: true,
        posPinHash: 'hash',
        role: 'staff',
        lineSub: 'sub',
      })),
    } as unknown as StaffUserService;

    const service = new OrderAdjustmentService(
      orders,
      approval,
      auditLog,
      query,
      notifications,
      staff,
      clock,
    );

    return { service, orders, approval, auditLog, query, notifications, staff, mockAdjustedLine };
  }

  it('adjusts line as void, cancels ticket when no active items remain, and emits events', async () => {
    const { service, orders, approval, auditLog, notifications } = setup({
      activeCount: 0,
      approval: { approvedBy: 'mgr-1', selfApproved: false },
    });

    const input: AdjustItemRequest = {
      reason: 'spoiled',
      note: 'dropped by guest',
      pin: '1234',
    };

    const result = await service.adjust('item-1', 'staff-1', input, 'void');

    expect(approval.resolve).toHaveBeenCalledWith({
      callerId: 'staff-1',
      pin: '1234',
      kind: 'void',
    });

    expect(orders.adjustLine).toHaveBeenCalledWith({
      itemId: 'item-1',
      kind: 'void',
      at: fixedNow,
      cancelledBy: 'staff-1',
      approvedBy: 'mgr-1',
      reason: 'spoiled',
      note: 'dropped by guest',
    });

    expect(auditLog.record).toHaveBeenCalledWith({
      entity: 'order_item',
      entityId: 'item-1',
      action: 'UPDATE',
      changedFields: {
        cancelKind: { from: null, to: 'void' },
        cancelReason: { from: null, to: 'spoiled' },
        cancelNote: { from: null, to: 'dropped by guest' },
        approvedBy: { from: null, to: 'mgr-1' },
        selfApproved: { from: null, to: 'false' },
      },
    });

    expect(orders.saveStatus).toHaveBeenCalledWith('ticket-1', 'cancelled', null);
    expect(notifications.emitToPos).toHaveBeenCalledWith(
      TICKET_STATUS_CHANGED,
      expect.objectContaining({
        ticketId: 'ticket-1',
        orderId: 'order-1',
        visitId: 'visit-1',
        status: 'cancelled',
      }),
    );
    expect(notifications.emitTabChanged).toHaveBeenCalledWith('visit-1');
    expect(result.id).toBe('item-1');
  });

  it('adjusts line as void but keeps ticket active when other items remain', async () => {
    const { service, orders, notifications } = setup({
      activeCount: 1, // another active item remains
    });

    const input: AdjustItemRequest = { reason: 'guest_changed' };
    await service.adjust('item-1', 'staff-1', input, 'void');

    expect(orders.saveStatus).not.toHaveBeenCalled();
    expect(notifications.emitToPos).not.toHaveBeenCalled();
    expect(notifications.emitTabChanged).toHaveBeenCalledWith('visit-1');
  });

  it('adjusts line as comp and does not cancel ticket even if active item count is 0', async () => {
    const { service, orders, notifications } = setup({
      activeCount: 0,
      approval: { approvedBy: 'mgr-1', selfApproved: false },
    });

    const input: AdjustItemRequest = { reason: 'special_service', note: 'VIP' };
    await service.adjust('item-1', 'staff-1', input, 'comp');

    expect(orders.adjustLine).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'comp' }),
    );
    // Comp items are still prepared/served, so ticket is never cancelled
    expect(orders.saveStatus).not.toHaveBeenCalled();
    expect(notifications.emitToPos).not.toHaveBeenCalled();
    expect(notifications.emitTabChanged).toHaveBeenCalledWith('visit-1');
  });

  it('throws NOT_FOUND when item does not exist', async () => {
    const { service } = setup({ locked: null });
    const input: AdjustItemRequest = { reason: 'spoiled' };

    await expect(service.adjust('item-999', 'staff-1', input, 'void')).rejects.toThrow(
      new DomainException('NOT_FOUND', 'ไม่พบรายการ', 404),
    );
  });

  it('throws 409 INVALID_STATE_TRANSITION when item is already cancelled', async () => {
    const { service } = setup({
      locked: {
        itemId: 'item-1',
        ticketId: 'ticket-1',
        orderId: 'order-1',
        visitId: 'visit-1',
        visitState: 'active',
        cancelledAt: new Date(),
        cancelKind: 'void',
      },
    });

    const input: AdjustItemRequest = { reason: 'spoiled' };
    await expect(service.adjust('item-1', 'staff-1', input, 'void')).rejects.toThrow(
      new DomainException('INVALID_STATE_TRANSITION', 'รายการนี้ถูกยกเลิกแล้ว', 409),
    );
  });

  it('throws 409 INVALID_STATE_TRANSITION when visit is not live', async () => {
    const { service } = setup({
      locked: {
        itemId: 'item-1',
        ticketId: 'ticket-1',
        orderId: 'order-1',
        visitId: 'visit-1',
        visitState: 'closed',
        cancelledAt: null,
        cancelKind: null,
      },
    });

    const input: AdjustItemRequest = { reason: 'spoiled' };
    await expect(service.adjust('item-1', 'staff-1', input, 'void')).rejects.toThrow(
      new DomainException('INVALID_STATE_TRANSITION', 'การเข้าใช้ไม่ได้เปิดอยู่', 409),
    );
  });

  it('throws 409 PAYMENT_IN_FLIGHT when payment is pending', async () => {
    const { service } = setup({ paymentStatus: 'pending' });

    const input: AdjustItemRequest = { reason: 'spoiled' };
    await expect(service.adjust('item-1', 'staff-1', input, 'void')).rejects.toThrow(
      new DomainException('PAYMENT_IN_FLIGHT', 'มีการชำระเงินค้างอยู่ ยกเลิก/Comp ไม่ได้', 409),
    );
  });

  it('throws 409 VISIT_PAID when payment is completed', async () => {
    const { service } = setup({ paymentStatus: 'completed' });

    const input: AdjustItemRequest = { reason: 'spoiled' };
    await expect(service.adjust('item-1', 'staff-1', input, 'void')).rejects.toThrow(
      new DomainException('VISIT_PAID', 'ชำระเงินแล้ว ยกเลิก/Comp ไม่ได้', 409),
    );
  });
});
