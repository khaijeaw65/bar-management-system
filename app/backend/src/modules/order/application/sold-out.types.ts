import type { AvailabilityTicket, MenuItem, NotVoidedTicket } from '@bar/contracts';
import type { TicketView } from './present-order.js';

export interface ToggleOutcome {
  changed: boolean;
  available: boolean;
  item: MenuItem;
  autoVoided: AvailabilityTicket[];
  notVoided: NotVoidedTicket[];
  cancelled: TicketView[];
  /** Visits that lost lines to the 86 — their guests' tabs changed. */
  voidedVisits: string[];
}

export type VoidTicketsOutcome = Pick<ToggleOutcome, 'autoVoided' | 'notVoided' | 'cancelled'>;

export interface SeatRef {
  seatLabel: string;
  ticketId: string;
}
