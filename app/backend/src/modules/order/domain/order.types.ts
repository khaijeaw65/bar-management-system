import type { ItemType, KitchenStation, OrderStatus, TableSeatKind } from '@bar/contracts';

export interface ChosenModifier {
  optionId: string;
  name: string;
  priceDelta: string;
}

export interface PricedLine {
  /** 1 … n in the request order, kept across the split into tickets. */
  lineNo: number;
  variantId: string;
  quantity: number;
  itemName: string;
  variantName: string;
  itemType: ItemType;
  kitchenTag: KitchenStation | null;
  unitPrice: string;
  orderedByName: string | null;
  notes: string | null;
  modifiers: ChosenModifier[];
}

export type TicketBucket = 'bar' | 'food' | 'charge';

export interface NewTicket {
  bucket: TicketBucket;
  lines: PricedLine[];
}

export interface NewOrder {
  visitId: string;
  orderNumber: number;
  businessDate: string;
  tickets: NewTicket[];
  placedAt: Date;
}

export interface LockedTicket {
  id: string;
  orderId: string;
  visitId: string;
  status: OrderStatus;
  sentAt: Date | null;
  seatKind: TableSeatKind;
  issueReason: string | null;
  issueItemId: string | null;
  issueNote: string | null;
  issueReportedBy: string | null;
  issueEscalatedAt: Date | null;
}

export interface TicketIssueWrite {
  status: OrderStatus;
  reason: string | null;
  itemId: string | null;
  note: string | null;
  reportedBy: string | null;
  escalatedAt: Date | null;
}

export type TicketLineState = 'active' | 'cancelled' | 'missing';

export interface OrderQuery {
  orderId?: string;
  visitId?: string;
  ticketId?: string;
  statuses?: OrderStatus[];
  excludeCharge: boolean;
  escalatedOnly?: boolean;
}

export interface BillRow {
  visitId: string;
  total: string;
  itemCount: number;
}

export interface OrderTotal {
  orderId: string;
  total: string;
}

export interface PendingItemLine {
  itemId: string;
  quantity: number;
  ticketId: string;
  ticketStatus: OrderStatus;
  visitId: string;
  orderNumber: number;
  seatLabel: string;
}
