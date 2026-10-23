/** Business days `from`–`to` as one half-open range of instants [start, end). */
export interface ReportWindow {
  from: string;
  to: string;
  start: Date;
  end: Date;
  /** Venue cut-off `HH:MM[:SS]`, Bangkok time. */
  cutoff: string;
}

export interface MethodTotal {
  amount: string;
  count: number;
}

export interface PeriodTotals {
  revenue: string;
  bills: number;
  averageBill: string;
  promptpay: MethodTotal;
  cash: MethodTotal;
  manualConfirmations: number;
}

export interface DayTotal {
  date: string;
  revenue: string;
  bills: number;
}

export interface ItemSalesInput {
  from: string;
  to: string;
  limit: number;
  /** Items created after this instant are too new for the bottom list (CD-05 R6). */
  newItemSince: Date;
}

export interface ItemSales {
  menuItemId: string;
  name: string;
  quantity: number;
  revenue: string;
}

export interface HourRevenue {
  hour: number;
  revenue: string;
}

export interface OpenSeat {
  seatLabel: string;
  openedAt: Date;
  total: string;
}

export interface TicketCounts {
  pending: number;
  escalatedIssues: number;
}
