import type { AvailabilityTicket, MenuItem, NotVoidedTicket } from '@bar/contracts';
import type { TicketView } from './present-order.js';

export interface ToggleOutcome {
  changed: boolean;
  available: boolean;
  item: MenuItem;
  autoVoided: AvailabilityTicket[];
  notVoided: NotVoidedTicket[];
  cancelled: TicketView[];
}

export interface SeatRef {
  seatLabel: string;
  ticketId: string;
}
