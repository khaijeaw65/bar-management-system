import type { ItemType, KitchenStation, OrderStatus, TableSeatKind } from '@bar/contracts';

export interface ChosenModifier {
  optionId: string;
  name: string;
  priceDelta: string;
}

export interface PricedLine {
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
}

export interface OrderQuery {
  orderId?: string;
  visitId?: string;
  ticketId?: string;
  statuses?: OrderStatus[];
  excludeCharge: boolean;
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
