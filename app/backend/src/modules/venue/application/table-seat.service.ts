import { Inject, Injectable } from '@nestjs/common';
import {
  TABLE_STAFF_CALLED,
  TABLE_STAFF_CALL_CLEARED,
  type CallStaffReason,
  type TableStaffCalledPayload,
  type TableSummary,
} from '@bar/contracts';
import { DomainException } from '../../../common/domain-exception.js';
import { CLOCK, type Clock } from '../../../common/clock.js';
import { NotificationsService } from '../../notifications/notifications.service.js';
import { BillService } from '../../payment/application/bill.service.js';
import { OrderQueryService } from '../../order/application/order-query.service.js';
import {
  TABLE_SEAT_REPOSITORY,
  type TableSeatRepository,
} from '../domain/table-seat.repository.js';
import type { SeatWithLiveVisit } from '../domain/table-seat.types.js';
import {
  VISIT_REPOSITORY,
  type VisitRepository,
} from '../domain/visit.repository.js';
import type { SeatIdentity } from '../domain/table-seat.types.js';
import { newQrToken } from './qr-token.js';
import { money } from '../../../common/money.js';
import { toTableSummary } from './table-summary.js';
import type { VisitBill } from '../../order/application/order.types.js';

@Injectable()
export class TableSeatService {
  public constructor(
    @Inject(TABLE_SEAT_REPOSITORY)
    private readonly tableSeatRepository: TableSeatRepository,
    @Inject(VISIT_REPOSITORY) private readonly visitRepository: VisitRepository,
    private readonly orders: OrderQueryService,
    private readonly bills: BillService,
    private readonly notifications: NotificationsService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  public async list(): Promise<TableSummary[]> {
    const active = await this.tableSeatRepository.listActive();
    const ids = this.liveVisitIds(active);
    const bills = await this.orders.billsFor(ids);
    const pending = await this.bills.pendingVisitIds(ids);
    return active.map((seat) => this.applyBill(toTableSummary(seat), bills, pending));
  }

  /** Customer QR scan (BRIEF-047): an inactive seat or an unknown token is simply not found. */
  public async findActiveSeatByQrToken(
    qrToken: string,
  ): Promise<{ seat: SeatIdentity; liveVisitId: string | null } | null> {
    const seat = await this.tableSeatRepository.findActiveByQrToken(qrToken);
    if (!seat) return null;
    const live = await this.visitRepository.findLiveBySeat(seat.id);
    return { seat, liveVisitId: live?.id ?? null };
  }

  /** Rings the bell on a seat (a newer call overwrites an older one) and tells the staff screens. */
  public async callStaff(
    tableSeatId: string,
    input: { reason: CallStaffReason | null; note: string | null },
  ): Promise<Date> {
    const calledAt = this.clock.now();
    await this.tableSeatRepository.setStaffCall(tableSeatId, { ...input, calledAt });
    const payload: TableStaffCalledPayload = { tableSeatId, ...input, calledAt: calledAt.toISOString() };
    this.notifications.emitToStaff(TABLE_STAFF_CALLED, payload);
    return calledAt;
  }

  /** Idempotent: no bell → nothing to clear, nothing emitted. */
  public async acknowledgeCall(tableSeatId: string): Promise<void> {
    if (!(await this.tableSeatRepository.findById(tableSeatId))) {
      throw new DomainException('NOT_FOUND', 'ไม่พบโต๊ะ', 404);
    }
    if (await this.tableSeatRepository.clearStaffCall(tableSeatId)) {
      this.notifications.emitToStaff(TABLE_STAFF_CALL_CLEARED, { tableSeatId });
    }
  }

  public async regenerateQr(id: string): Promise<string> {
    const seat = await this.tableSeatRepository.findActiveById(id);
    if (!seat) throw new DomainException('NOT_FOUND', 'ไม่พบโต๊ะ', 404);
    const qrToken = newQrToken();
    await this.tableSeatRepository.replaceQrToken(seat.id, qrToken);
    return qrToken;
  }

  private liveVisitIds(seats: readonly SeatWithLiveVisit[]): string[] {
    return seats.flatMap((seat) => (seat.currentVisit ? [seat.currentVisit.id] : []));
  }

  private applyBill(
    summary: TableSummary,
    bills: ReadonlyMap<string, VisitBill>,
    pending: ReadonlySet<string>,
  ): TableSummary {
    const visit = summary.currentVisit;
    if (!visit) return summary;
    const bill = bills.get(visit.id);
    return {
      ...summary,
      currentVisit: {
        ...visit,
        total: bill ? money(bill.total) : visit.total,
        itemCount: bill ? bill.itemCount : visit.itemCount,
        paymentPending: pending.has(visit.id),
      },
    };
  }
}
