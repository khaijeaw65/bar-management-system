import { Inject, Injectable } from '@nestjs/common';
import type {
  ReportDaily,
  ReportItems,
  ReportItemsQuery,
  ReportSummary,
  ReportToday,
  ReportsPeriodQuery,
} from '@bar/contracts';
import { businessDate } from '../../../common/business-date.js';
import { CLOCK, type Clock } from '../../../common/clock.js';
import { REPORT_QUERIES, type ReportQueries } from '../domain/ports/report-queries.port.js';
import type {
  HourRevenue,
  OpenSeat,
  PeriodTotals,
  ReportWindow,
  TicketCounts,
} from '../domain/report.types.js';
import { fillDays, hourlyBuckets, previousPeriod, reportWindow } from './report-period.js';
import type { BusinessPeriod } from './report-period.types.js';

// Bottom sellers skip items younger than a week (CD-05 R6).
const NEW_ITEM_MS = 7 * 24 * 3600 * 1000;

@Injectable()
export class ReportsService {
  public constructor(
    @Inject(REPORT_QUERIES) private readonly queries: ReportQueries,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  public async summary(period: ReportsPeriodQuery): Promise<ReportSummary> {
    const cutoff = await this.queries.businessDayCutoff();
    const previous = previousPeriod(period);
    const [current, before] = await Promise.all([
      this.queries.periodTotals(reportWindow(period, cutoff)),
      this.queries.periodTotals(reportWindow(previous, cutoff)),
    ]);
    return {
      ...this.periodFigures(period, current),
      payments: { promptpay: current.promptpay, cash: current.cash },
      manualConfirmations: current.manualConfirmations,
      previous: this.periodFigures(previous, before),
    };
  }

  public async daily(period: ReportsPeriodQuery): Promise<ReportDaily> {
    const cutoff = await this.queries.businessDayCutoff();
    const totals = await this.queries.dailyTotals(reportWindow(period, cutoff));
    return { items: fillDays(period, totals) };
  }

  public async items(query: ReportItemsQuery): Promise<ReportItems> {
    const newItemSince = new Date(this.clock.now().getTime() - NEW_ITEM_MS);
    const input = { from: query.from, to: query.to, limit: query.limit, newItemSince };
    const items =
      query.sort === 'top' ? await this.queries.topItems(input) : await this.queries.bottomItems(input);
    return { items };
  }

  public async today(): Promise<ReportToday> {
    const now = this.clock.now();
    const cutoff = await this.queries.businessDayCutoff();
    const date = businessDate(now, cutoff);
    const window = reportWindow({ from: date, to: date }, cutoff);
    const [totals, hours, seats, tickets] = await this.loadToday(window);
    return {
      businessDate: date,
      revenue: totals.revenue,
      bills: totals.bills,
      hourly: hourlyBuckets(cutoff, hours),
      openSeats: seats.map((seat) => ({ ...seat, openedAt: seat.openedAt.toISOString() })),
      pendingTickets: tickets.pending,
      escalatedIssues: tickets.escalatedIssues,
      generatedAt: now.toISOString(),
    };
  }

  private loadToday(window: ReportWindow): Promise<[PeriodTotals, HourRevenue[], OpenSeat[], TicketCounts]> {
    return Promise.all([
      this.queries.periodTotals(window),
      this.queries.hourlyRevenue(window),
      this.queries.openSeats(),
      this.queries.ticketCounts(),
    ]);
  }

  private periodFigures(period: BusinessPeriod, totals: PeriodTotals): ReportSummary['previous'] {
    return {
      from: period.from,
      to: period.to,
      revenue: totals.revenue,
      bills: totals.bills,
      averageBill: totals.averageBill,
    };
  }
}
