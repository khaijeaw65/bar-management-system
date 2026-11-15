import { Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import {
  TICKET_STATUS_CHANGED,
  type AdjustItemRequest,
  type OrderLine,
  type TicketStatusChangedPayload,
} from '@bar/contracts';
import { AuditLogService } from '../../../common/audit/audit-log.service.js';
import { Clock } from '../../../common/clock.js';
import { DomainException } from '../../../common/domain-exception.js';
import { StaffUserService } from '../../iam/application/staff-user.service.js';
import { NotificationsService } from '../../notifications/notifications.service.js';
import { OrderRepository } from '../domain/order.repository.js';
import type { LockedItemAdjustment } from '../domain/order.types.js';
import { ApprovalService } from './approval.service.js';
import type { AdjustmentOutcome } from './order-adjustment.types.js';
import { OrderQueryService } from './order-query.service.js';

@Injectable()
export class OrderAdjustmentService {
  public constructor(
    private readonly orders: OrderRepository,
    private readonly approval: ApprovalService,
    private readonly auditLog: AuditLogService,
    private readonly query: OrderQueryService,
    private readonly notifications: NotificationsService,
    private readonly staff: StaffUserService,
    private readonly clock: Clock,
  ) {}

  public async adjust(
    itemId: string,
    callerId: string,
    input: AdjustItemRequest,
    kind: 'void' | 'comp',
  ): Promise<OrderLine> {
    const outcome = await this.executeAdjustment(itemId, callerId, input, kind);
    await this.publishEvents(outcome, callerId);
    return await this.fetchAdjustedLine(outcome.orderId, itemId);
  }

  @Transactional()
  private async executeAdjustment(
    itemId: string,
    callerId: string,
    input: AdjustItemRequest,
    kind: 'void' | 'comp',
  ): Promise<AdjustmentOutcome> {
    const locked = await this.requireItem(itemId);
    this.verifyItemState(locked);
    await this.verifyNoPaymentMoving(locked.visitId);

    const approval = await this.approval.resolve({ callerId, pin: input.pin, kind });
    const now = this.clock.now();

    await this.orders.adjustLine({
      itemId,
      kind,
      at: now,
      cancelledBy: callerId,
      approvedBy: approval.approvedBy,
      reason: input.reason,
      note: input.note ?? null,
    });

    await this.recordAudit(itemId, kind, input, approval.approvedBy, approval.selfApproved);

    const ticketCancelled = await this.cancelTicketIfEmpty(locked.ticketId, kind);

    return {
      orderId: locked.orderId,
      ticketId: locked.ticketId,
      visitId: locked.visitId,
      ticketCancelled,
      adjustedAt: now,
    };
  }

  private async requireItem(itemId: string): Promise<LockedItemAdjustment> {
    const locked = await this.orders.lockItemForAdjustment(itemId);
    if (!locked) throw new DomainException('NOT_FOUND', 'ไม่พบรายการ', 404);
    return locked;
  }

  private verifyItemState(item: LockedItemAdjustment): void {
    if (item.cancelledAt !== null) {
      throw new DomainException('INVALID_STATE_TRANSITION', 'รายการนี้ถูกยกเลิกแล้ว', 409);
    }
    if (!['open', 'active', 'idle'].includes(item.visitState)) {
      throw new DomainException('INVALID_STATE_TRANSITION', 'การเข้าใช้ไม่ได้เปิดอยู่', 409);
    }
  }

  private async verifyNoPaymentMoving(visitId: string): Promise<void> {
    const status = await this.orders.paymentStatusOnVisit(visitId);
    if (status === 'pending') {
      throw new DomainException('PAYMENT_IN_FLIGHT', 'มีการชำระเงินค้างอยู่ ยกเลิก/Comp ไม่ได้', 409);
    }
    if (status === 'completed') {
      throw new DomainException('VISIT_PAID', 'ชำระเงินแล้ว ยกเลิก/Comp ไม่ได้', 409);
    }
  }

  private async recordAudit(
    itemId: string,
    kind: 'void' | 'comp',
    input: AdjustItemRequest,
    approvedBy: string | null,
    selfApproved: boolean,
  ): Promise<void> {
    await this.auditLog.record({
      entity: 'order_item',
      entityId: itemId,
      action: 'UPDATE',
      changedFields: {
        cancelKind: { from: null, to: kind },
        cancelReason: { from: null, to: input.reason },
        cancelNote: { from: null, to: input.note ?? null },
        approvedBy: { from: null, to: approvedBy },
        selfApproved: { from: null, to: String(selfApproved) },
      },
    });
  }

  private async cancelTicketIfEmpty(ticketId: string, kind: 'void' | 'comp'): Promise<boolean> {
    if (kind !== 'void') return false;
    const activeCount = await this.orders.countActiveLines(ticketId);
    if (activeCount > 0) return false;
    await this.orders.saveStatus(ticketId, 'cancelled', null);
    return true;
  }

  private async publishEvents(outcome: AdjustmentOutcome, callerId: string): Promise<void> {
    if (outcome.ticketCancelled) {
      const actor = await this.staff.findActiveById(callerId);
      const payload: TicketStatusChangedPayload = {
        ticketId: outcome.ticketId,
        orderId: outcome.orderId,
        visitId: outcome.visitId,
        status: 'cancelled',
        updatedAt: outcome.adjustedAt.toISOString(),
        updatedBy: actor
          ? { staffId: actor.id, displayName: actor.displayName }
          : { staffId: callerId, displayName: 'พนักงาน' },
      };
      this.notifications.emitToPos(TICKET_STATUS_CHANGED, payload);
    }
    this.notifications.emitTabChanged(outcome.visitId);
  }

  private async fetchAdjustedLine(orderId: string, itemId: string): Promise<OrderLine> {
    const order = await this.query.getById(orderId);
    const line = order.tickets.flatMap((t) => t.items).find((i) => i.id === itemId);
    if (!line) throw new DomainException('NOT_FOUND', 'ไม่พบรายการหลังทำรายการ', 404);
    return line;
  }
}
