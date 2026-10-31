import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { money } from '../../../../common/money.js';
import { readDate, readText } from '../../../../common/persistence/row-values.js';
import type { ReportQueries } from '../../domain/ports/report-queries.port.js';
import type {
  DayTotal,
  HourRevenue,
  ItemSales,
  ItemSalesInput,
  OpenSeat,
  PeriodTotals,
  ReportWindow,
  TicketCounts,
} from '../../domain/report.types.js';
import {
  BOTTOM_ITEMS_SQL,
  CUTOFF_SQL,
  DAILY_TOTALS_SQL,
  HOURLY_REVENUE_SQL,
  OPEN_SEATS_SQL,
  PERIOD_TOTALS_SQL,
  TICKET_COUNTS_SQL,
  TOP_ITEMS_SQL,
} from './reports.sql.js';

// Schema default for venue.business_day_cutoff, used before a venue row exists.
const DEFAULT_CUTOFF = '06:00:00';

@Injectable()
export class ReportsTypeormQueries implements ReportQueries {
  public constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  public async businessDayCutoff(): Promise<string> {
    const [row] = await this.rows(CUTOFF_SQL, []);
    return row ? readText(row.cutoff) : DEFAULT_CUTOFF;
  }

  public async periodTotals(window: ReportWindow): Promise<PeriodTotals> {
    const [row = {}] = await this.rows(PERIOD_TOTALS_SQL, [window.start, window.end]);
    return {
      revenue: money(readText(row.revenue)),
      bills: this.count(row.bills),
      averageBill: money(readText(row.average_bill)),
      promptpay: { amount: money(readText(row.promptpay_amount)), count: this.count(row.promptpay_count) },
      cash: { amount: money(readText(row.cash_amount)), count: this.count(row.cash_count) },
      manualConfirmations: this.count(row.manual_confirmations),
    };
  }

  public async dailyTotals(window: ReportWindow): Promise<DayTotal[]> {
    const rows = await this.rows(DAILY_TOTALS_SQL, [window.start, window.end, window.cutoff]);
    return rows.map((row) => ({
      date: readText(row.date),
      revenue: money(readText(row.revenue)),
      bills: this.count(row.bills),
    }));
  }

  public async topItems(input: ItemSalesInput): Promise<ItemSales[]> {
    const rows = await this.rows(TOP_ITEMS_SQL, [input.from, input.to, input.limit]);
    return rows.map((row) => this.toItemSales(row));
  }

  public async bottomItems(input: ItemSalesInput): Promise<ItemSales[]> {
    const params = [input.from, input.to, input.limit, input.newItemSince];
    const rows = await this.rows(BOTTOM_ITEMS_SQL, params);
    return rows.map((row) => this.toItemSales(row));
  }

  public async hourlyRevenue(window: ReportWindow): Promise<HourRevenue[]> {
    const rows = await this.rows(HOURLY_REVENUE_SQL, [window.start, window.end]);
    return rows.map((row) => ({ hour: this.count(row.hour), revenue: money(readText(row.revenue)) }));
  }

  public async openSeats(): Promise<OpenSeat[]> {
    const rows = await this.rows(OPEN_SEATS_SQL, []);
    return rows.map((row) => ({
      seatLabel: readText(row.seat_label),
      openedAt: readDate(row.opened_at),
      total: money(readText(row.total)),
    }));
  }

  public async ticketCounts(): Promise<TicketCounts> {
    const [row = {}] = await this.rows(TICKET_COUNTS_SQL, []);
    return { pending: this.count(row.pending), escalatedIssues: this.count(row.escalated_issues) };
  }

  private rows(sql: string, params: unknown[]): Promise<Record<string, unknown>[]> {
    return this.dataSource.query(sql, params);
  }

  private count(value: unknown): number {
    if (typeof value !== 'number') throw new Error('row is missing a count');
    return value;
  }

  private toItemSales(row: Record<string, unknown>): ItemSales {
    return {
      menuItemId: readText(row.menu_item_id),
      name: readText(row.name),
      quantity: this.count(row.quantity),
      revenue: money(readText(row.revenue)),
    };
  }
}
