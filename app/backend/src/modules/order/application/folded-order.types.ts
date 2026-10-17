import type { KitchenStation, OrderStatus, TableSeatKind } from '@bar/contracts';
import type { OrderLine } from '@bar/contracts';

export interface FoldedTicket {
  id: string;
  orderId: string;
  visitId: string;
  orderNumber: number;
  station: KitchenStation | null;
  status: OrderStatus;
  seat: { id: string; label: string; kind: TableSeatKind };
  items: OrderLine[];
  updatedById: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FoldedOrder {
  id: string;
  visitId: string;
  orderNumber: number;
  businessDate: string;
  createdAt: string;
  createdById: string | null;
  tickets: FoldedTicket[];
}
