import { Injectable } from '@nestjs/common';
import { sumSatang, toSatang } from '../../../common/money.js';
import { OrderQueryService } from '../../order/application/order-query.service.js';
import type { OrderTotal } from '../../order/domain/order.types.js';
import { PaymentRepository } from '../domain/ports/payment.repository.port.js';
import type { PaymentRecord } from '../domain/payment.types.js';
import type { BillSnapshot } from './payment.types.js';

@Injectable()
export class BillService {
  public constructor(
    private readonly payments: PaymentRepository,
    private readonly orders: OrderQueryService,
  ) {}

  public async forVisit(visitId: string): Promise<BillSnapshot> {
    const totals = await this.orders.orderTotals(visitId);
    const rows = await this.payments.listByVisit(visitId);
    const covered = await this.payments.coveredOrderIds(visitId);
    return this.snapshot(totals, rows, covered);
  }

  public async pendingVisitIds(visitIds: readonly string[]): Promise<Set<string>> {
    return new Set(await this.payments.pendingVisitIds(visitIds));
  }

  private snapshot(
    totals: readonly OrderTotal[],
    rows: readonly PaymentRecord[],
    coveredIds: readonly string[],
  ): BillSnapshot {
    const covered = new Set(coveredIds);
    const uncovered = totals.filter((row) => this.isOpen(row, covered));
    const paid = rows.filter((row) => row.status === 'completed');
    return {
      bill: {
        total: sumSatang(totals.map((row) => row.total)),
        paid: sumSatang(paid.map((row) => row.amount)),
        remaining: sumSatang(uncovered.map((row) => row.total)),
        locked: rows.some((row) => row.status === 'pending'),
      },
      uncoveredOrderIds: uncovered.map((row) => row.orderId),
    };
  }

  private isOpen(row: OrderTotal, covered: ReadonlySet<string>): boolean {
    return !covered.has(row.orderId) && toSatang(row.total) > 0;
  }
}
