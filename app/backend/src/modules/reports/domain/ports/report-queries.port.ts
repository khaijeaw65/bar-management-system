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
export interface ReportQueries {
  businessDayCutoff(): Promise<string>;
  periodTotals(window: ReportWindow): Promise<PeriodTotals>;
  dailyTotals(window: ReportWindow): Promise<DayTotal[]>;
  topItems(input: ItemSalesInput): Promise<ItemSales[]>;
  bottomItems(input: ItemSalesInput): Promise<ItemSales[]>;
  hourlyRevenue(window: ReportWindow): Promise<HourRevenue[]>;
  openSeats(): Promise<OpenSeat[]>;
  ticketCounts(): Promise<TicketCounts>;
}

export const REPORT_QUERIES = Symbol('REPORT_QUERIES');
