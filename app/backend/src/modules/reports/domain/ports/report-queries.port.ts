import type {
  DayTotal,
  HourRevenue,
  ItemSales,
  ItemSalesInput,
  OpenSeat,
  PeriodTotals,
  ReportWindow,
  TicketCounts,
} from '../report.types.js';

/** Read-only SQL over other modules' tables (BRIEF-036 Q1 = A). No writes. */
export abstract class ReportQueries {
  public abstract businessDayCutoff(): Promise<string>;
  public abstract periodTotals(window: ReportWindow): Promise<PeriodTotals>;
  public abstract dailyTotals(window: ReportWindow): Promise<DayTotal[]>;
  public abstract topItems(input: ItemSalesInput): Promise<ItemSales[]>;
  public abstract bottomItems(input: ItemSalesInput): Promise<ItemSales[]>;
  public abstract hourlyRevenue(window: ReportWindow): Promise<HourRevenue[]>;
  public abstract openSeats(): Promise<OpenSeat[]>;
  public abstract ticketCounts(): Promise<TicketCounts>;
}
