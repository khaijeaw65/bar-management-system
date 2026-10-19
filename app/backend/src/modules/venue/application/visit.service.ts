import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { VISIT_OPENED, VISIT_STATE_CHANGED, type TableSummary } from '@bar/contracts';
import { DomainException } from '../../../common/domain-exception.js';
import { StaffUserService } from '../../iam/application/staff-user.service.js';
import { NotificationsService } from '../../notifications/notifications.service.js';
import {
  TABLE_SEAT_REPOSITORY,
  type TableSeatRepository,
} from '../domain/table-seat.repository.js';
import {
  VISIT_REPOSITORY,
  type VisitRepository,
} from '../domain/visit.repository.js';
import type { VisitRecord } from '../domain/visit.types.js';
import { PaymentGuard } from '../../payment/application/payment-guard.js';
import { toTableSummary } from './table-summary.js';
import type {
  OpenVisitInput,
  OpenVisitResult,
  OrderClaim,
  VisitOpenerView,
  VisitView,
} from './visit.types.js';

@Injectable()
export class VisitService {
  public constructor(
    @Inject(VISIT_REPOSITORY) private readonly visitRepository: VisitRepository,
    @Inject(TABLE_SEAT_REPOSITORY)
    private readonly tableSeatRepository: TableSeatRepository,
    private readonly staffUserService: StaffUserService,
    private readonly notificationsService: NotificationsService,
    private readonly paymentGuard: PaymentGuard,
  ) {}

  public async open(input: OpenVisitInput): Promise<OpenVisitResult> {
    await this.requireActiveSeat(input.tableSeatId);
    const result = await this.insertOrAttach(input);
    await this.emitOpened(result);
    return result;
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

  private async insertOrAttach(input: OpenVisitInput): Promise<OpenVisitResult> {
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
    const summary = await this.summaryFor(result.visit.tableSeatId);
    if (!summary) return;
    this.notificationsService.emitToPos(VISIT_OPENED, summary);
  }

  private async finishClose(closed: VisitRecord): Promise<VisitView> {
    const view = await this.toView(closed);
    this.emitClosed(view);
    return view;
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
  }

  private async summaryFor(tableSeatId: string): Promise<TableSummary | null> {
    const seats = await this.tableSeatRepository.listActive();
    const seat = seats.find((item) => item.id === tableSeatId);
    if (!seat) return null;
    return toTableSummary(seat);
  }

  private async requireActiveSeat(id: string): Promise<void> {
    const seat = await this.tableSeatRepository.findActiveById(id);
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
