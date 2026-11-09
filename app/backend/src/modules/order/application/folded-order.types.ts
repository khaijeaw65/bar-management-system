import type { KitchenStation, OrderLine, OrderStatus, TableSeatKind, TicketIssueReason } from '@bar/contracts';

export interface FoldedTicket {
  id: string;
  orderId: string;
  visitId: string;
  orderNumber: number;
  station: KitchenStation | null;
  status: OrderStatus;
  seat: { id: string; label: string; kind: TableSeatKind };
  items: FoldedLine[];
  issueReason: TicketIssueReason | null;
  issueItemId: string | null;
  issueNote: string | null;
  issueReportedById: string | null;
  issueEscalatedAt: string | null;
  updatedById: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FoldedLine extends OrderLine {
  cancelledById: string | null;
  approvedById: string | null;
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
