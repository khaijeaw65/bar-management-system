import { Inject, Injectable } from '@nestjs/common';
import type { TableSummary } from '@bar/contracts';
import { DomainException } from '../../../common/domain-exception.js';
import { OrderQueryService } from '../../order/application/order-query.service.js';
import {
  TABLE_SEAT_REPOSITORY,
  type TableSeatRepository,
} from '../domain/table-seat.repository.js';
import type { SeatWithLiveVisit } from '../domain/table-seat.types.js';
import { newQrToken } from './qr-token.js';
import { money } from '../../order/application/money.js';
import { toTableSummary } from './table-summary.js';
import type { VisitBill } from '../../order/application/order.types.js';

@Injectable()
export class TableSeatService {
  public constructor(
    @Inject(TABLE_SEAT_REPOSITORY)
    private readonly tableSeatRepository: TableSeatRepository,
    private readonly orders: OrderQueryService,
  ) {}

  public async list(): Promise<TableSummary[]> {
    const active = await this.tableSeatRepository.listActive();
    const bills = await this.orders.billsFor(liveVisitIds(active));
    return active.map((seat) => applyBill(toTableSummary(seat), bills));
  }

  public async regenerateQr(id: string): Promise<string> {
    const seat = await this.tableSeatRepository.findActiveById(id);
    if (!seat) throw new DomainException('NOT_FOUND', 'ไม่พบโต๊ะ', 404);
    const qrToken = newQrToken();
    await this.tableSeatRepository.replaceQrToken(seat.id, qrToken);
    return qrToken;
  }
}

function liveVisitIds(seats: readonly SeatWithLiveVisit[]): string[] {
  return seats.flatMap((seat) => (seat.currentVisit ? [seat.currentVisit.id] : []));
}

function applyBill(summary: TableSummary, bills: ReadonlyMap<string, VisitBill>): TableSummary {
  const visit = summary.currentVisit;
  if (!visit) return summary;
  const bill = bills.get(visit.id);
  if (!bill) return summary;
  return {
    ...summary,
    currentVisit: { ...visit, total: money(bill.total), itemCount: bill.itemCount },
  };
}
