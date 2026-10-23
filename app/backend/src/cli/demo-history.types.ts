import type { KitchenStation, PaymentConfirmedVia, PaymentMethod } from '@bar/contracts';

/** Returns a number in [0, 1). */
export type DemoRandom = () => number;

export interface DemoVariant {
  id: string;
  itemName: string;
  variantName: string;
  price: string;
  station: KitchenStation;
}

export interface DemoCatalog {
  staffId: string;
  seatIds: string[];
  variants: DemoVariant[];
}

export interface DemoLine {
  variant: DemoVariant;
  quantity: number;
  cancelled: boolean;
}

export interface DemoOrder {
  at: Date;
  lines: DemoLine[];
}

export interface DemoPayment {
  method: PaymentMethod;
  confirmedVia: PaymentConfirmedVia;
}

export interface DemoVisit {
  seatId: string;
  openedAt: Date;
  closedAt: Date;
  orders: DemoOrder[];
  payment: DemoPayment;
}

export interface DemoDay {
  businessDate: string;
  visits: DemoVisit[];
}

export interface DemoHistoryResult {
  days: number;
  visits: number;
  payments: number;
}

export interface DemoVisitWrite {
  businessDate: string;
  visit: DemoVisit;
  staffId: string;
  /** First order number this visit may use. */
  orderNumber: number;
}

export interface DemoPaymentWrite extends DemoVisitWrite {
  visitId: string;
}

export interface DemoOrderWrite extends DemoPaymentWrite {
  order: DemoOrder;
}

export interface DemoTicketWrite extends DemoOrderWrite {
  orderId: string;
  station: KitchenStation;
  lines: DemoLine[];
}

export interface DemoItemContext {
  ticketId: string;
  lineNo: number;
  staffId: string;
  at: Date;
}

export interface AuditStamp {
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}
