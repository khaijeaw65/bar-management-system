import { Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import {
  TABLE_STAFF_CALL_CLEARED,
  VISIT_OPENED,
  VISIT_STATE_CHANGED,
  type TableStaffCallClearedPayload,
  type TableSummary,
} from '@bar/contracts';
import { DomainException } from '../../../common/domain-exception.js';
import { StaffUserService } from '../../iam/application/staff-user.service.js';
import { NotificationsService } from '../../notifications/notifications.service.js';
import { TableSeatRepository } from '../domain/table-seat.repository.js';
import { VisitRepository } from '../domain/visit.repository.js';
import type { VisitRecord } from '../domain/visit.types.js';
import { PaymentGuard } from '../../payment/application/payment-guard.js';
import { toTableSummary } from './table-summary.js';
import type {
  OpenVisitInput,
  OpenVisitResult,
  GuestVisit,
  OrderClaim,
  VisitOpenerView,
  VisitView,
} from './visit.types.js';

@Injectable()
export class VisitService {
  public constructor(
    private readonly visitRepository: VisitRepository,
    private readonly tableSeatRepository: TableSeatRepository,
    private readonly staffUserService: StaffUserService,
    private readonly notificationsService: NotificationsService,
    private readonly paymentGuard: PaymentGuard,
  ) {}

  public async open(input: OpenVisitInput): Promise<OpenVisitResult> {
    const result = await this.insertOrAttach(input);
    await this.emitOpened(result);
    return result;
  }

  /** Inside the order transaction: the guest's first order opens the visit (`qr`, no staff) or joins the live one. */
  public async openForGuest(tableSeatId: string): Promise<GuestVisit> {
    const opened = await this.visitRepository.openForGuest(tableSeatId);
    if (!opened) throw new DomainException('CONFLICT', 'สถานะโต๊ะไม่ถูกต้อง', 409);
    return { visitId: opened.id, tableSeatId, created: opened.created };
  }

  /** After commit: the POS learns a new table is occupied. */
  public async announceOpened(tableSeatId: string, visitId: string): Promise<void> {
    const summary = await this.summaryFor(tableSeatId);
    if (summary) this.notificationsService.emitToPos(VISIT_OPENED, summary);
    this.notificationsService.emitSeatVisitOpened(tableSeatId, visitId);
  }

  public async getById(id: string): Promise<VisitView> {
    return this.toView(await this.requireVisit(id));
  }

  public async claimForOrder(visitId: string): Promise<OrderClaim> {
    const locked = await this.visitRepository.lockById(visitId);
    if (!locked) throw new DomainException('NOT_FOUND', 'ไม่พบการเข้าใช้', 404);
    if (!this.isLiveVisit(locked.state)) {
      throw new DomainException('INVALID_STATE_TRANSITION', 'สถานะโต๊ะไม่ถูกต้อง', 409);
    }
    const activated = await this.visitRepository.activateIfWaiting(visitId);
    return { activated: activated !== null, visitId: locked.id, tableSeatId: locked.tableSeatId };
  }

  public async lockLive(visitId: string): Promise<void> {
    const locked = await this.visitRepository.lockById(visitId);
    if (!locked) throw new DomainException('NOT_FOUND', 'ไม่พบการเข้าใช้', 404);
    if (!this.isLiveVisit(locked.state)) {
      throw new DomainException('INVALID_STATE_TRANSITION', 'สถานะโต๊ะไม่ถูกต้อง', 409);
    }
  }

  /** Same row lock as `lockLive`, but a missing or closed visit is skipped. */
  public async lockIfLive(visitId: string): Promise<boolean> {
    const locked = await this.visitRepository.lockById(visitId);
    if (!locked) return false;
    return this.isLiveVisit(locked.state);
  }

  public async close(id: string): Promise<VisitView> {
    const closed = await this.closeWhenClear(id);
    if (closed) return this.finishClose(closed);
    return this.rejectClose(id);
  }

  @Transactional()
  private async closeWhenClear(id: string): Promise<VisitRecord | null> {
    const locked = await this.visitRepository.lockById(id);
    if (!locked || !this.isLiveVisit(locked.state)) return null;
    await this.paymentGuard.assertNoPaymentInFlight(id);
    return this.visitRepository.closeIfLive(id);
  }

  @Transactional()
  private async insertOrAttach(input: OpenVisitInput): Promise<OpenVisitResult> {
    await this.requireActiveSeat(input.tableSeatId);
    const inserted = await this.visitRepository.insert(input);
    if (inserted.kind === 'taken') return this.attachedVisit(input.tableSeatId);
    return { visit: await this.toView(inserted.visit), attached: false };
  }

  private async attachedVisit(tableSeatId: string): Promise<OpenVisitResult> {
    const live = await this.visitRepository.findLiveBySeat(tableSeatId);
    if (!live) throw new DomainException('CONFLICT', 'สถานะโต๊ะไม่ถูกต้อง', 409);
    return { visit: await this.toView(live), attached: true };
  }

  private async emitOpened(result: OpenVisitResult): Promise<void> {
    if (result.attached) return;
    await this.announceOpened(result.visit.tableSeatId, result.visit.id);
  }

  private async finishClose(closed: VisitRecord): Promise<VisitView> {
    const view = await this.toView(closed);
    await this.clearBell(view.tableSeatId);
    this.emitClosed(view);
    return view;
  }

  // The bell belongs to the seat; a closed visit leaves nothing for staff to answer.
  private async clearBell(tableSeatId: string): Promise<void> {
    if (await this.tableSeatRepository.clearStaffCall(tableSeatId)) {
      const payload: TableStaffCallClearedPayload = { tableSeatId, acknowledgedBy: null };
      this.notificationsService.emitToStaff(TABLE_STAFF_CALL_CLEARED, payload);
    }
  }

  private async rejectClose(id: string): Promise<never> {
    const current = await this.visitRepository.findById(id);
    if (!current) throw new DomainException('NOT_FOUND', 'ไม่พบการเข้าใช้', 404);
    throw new DomainException(
      'INVALID_STATE_TRANSITION',
      'สถานะโต๊ะไม่ถูกต้อง',
      409,
    );
  }

  private emitClosed(visit: VisitView): void {
    this.notificationsService.emitToPos(VISIT_STATE_CHANGED, {
      visitId: visit.id,
      tableSeatId: visit.tableSeatId,
      state: visit.state,
    });
    this.notificationsService.emitTabChanged(visit.id, true);
  }

  private async summaryFor(tableSeatId: string): Promise<TableSummary | null> {
    const seats = await this.tableSeatRepository.listActive();
    const seat = seats.find((item) => item.id === tableSeatId);
    if (!seat) return null;
    return toTableSummary(seat);
  }

  private async requireActiveSeat(id: string): Promise<void> {
    const seat = await this.tableSeatRepository.lockActiveForShare(id);
    if (!seat) throw new DomainException('NOT_FOUND', 'ไม่พบโต๊ะ', 404);
  }

  private async requireVisit(id: string): Promise<VisitRecord> {
    const visit = await this.visitRepository.findById(id);
    if (!visit) throw new DomainException('NOT_FOUND', 'ไม่พบการเข้าใช้', 404);
    return visit;
  }

  private async toView(visit: VisitRecord): Promise<VisitView> {
    const seat = await this.tableSeatRepository.findById(visit.tableSeatId);
    if (!seat) throw new DomainException('NOT_FOUND', 'ไม่พบโต๊ะ', 404);
    return {
      ...visit,
      seatLabel: seat.label,
      seatKind: seat.kind,
      opener: await this.openerOf(visit.openedBy),
    };
  }

  private async openerOf(
    staffId: string | null,
  ): Promise<VisitOpenerView | null> {
    if (!staffId) return null;
    const staff = await this.staffUserService.findById(staffId);
    if (!staff) return null;
    return { staffId: staff.id, displayName: staff.displayName };
  }

  private isLiveVisit(state: VisitRecord['state']): boolean {
    return state === 'open' || state === 'active' || state === 'idle';
  }
}
