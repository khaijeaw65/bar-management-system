import type { Ticket } from '@bar/contracts';

export type NextAction = 'accept' | 'ready' | 'send';

/**
 * The one step a card offers next. Mirrors the server rule (ticket-transition.ts, DR-014 #1, R15):
 * READY exists only with the kitchen screen on and only for table seats; counter seats and
 * kitchen-off venues go accepted → sent. The server stays the authority — drift ends in a 409.
 */
export function nextAction(ticket: Pick<Ticket, 'status' | 'seat'>, kitchenOn: boolean): NextAction | null {
  switch (ticket.status) {
    case 'pending':
      return 'accept';
    case 'accepted':
      return kitchenOn && ticket.seat.kind === 'table' ? 'ready' : 'send';
    case 'ready':
      return 'send';
    default:
      return null;
  }
}

/** Button copy, CD-08 §6. */
export const ACTION_LABEL: Record<NextAction, string> = {
  accept: 'รับออเดอร์',
  ready: 'พร้อมแล้ว',
  send: 'เสิร์ฟแล้ว',
};
