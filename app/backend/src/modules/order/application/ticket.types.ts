import type { TicketIssueWrite } from '../domain/order.types.js';
import type { TicketView } from './present-order.js';

export type TicketEvent = 'status' | 'escalated';

export interface ResolvedTicket {
  ticket: TicketView;
  kind: TicketEvent;
  written: TicketIssueWrite;
}
