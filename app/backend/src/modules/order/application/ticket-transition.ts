import type { OrderStatus, TableSeatKind } from '@bar/contracts';
import { DomainException } from '../../../common/domain-exception.js';

export type TicketAction = 'accept' | 'ready' | 'send';

const BAD_STATE = new DomainException(
  'INVALID_STATE_TRANSITION',
  'สถานะใบงานไม่ถูกต้อง',
  409,
);

export function readyStepApplies(kitchenOn: boolean, seatKind: TableSeatKind): boolean {
  return kitchenOn && seatKind === 'table';
}

export function nextTicketStatus(
  action: TicketAction,
  status: OrderStatus,
  readyStep: boolean,
): OrderStatus {
  if (action === 'accept') return onlyFrom(status, 'pending', 'accepted');
  if (action === 'ready') return markReady(status, readyStep);
  return markSent(status, readyStep);
}

function markReady(status: OrderStatus, readyStep: boolean): OrderStatus {
  if (!readyStep) throw BAD_STATE;
  return onlyFrom(status, 'accepted', 'ready');
}

function markSent(status: OrderStatus, readyStep: boolean): OrderStatus {
  if (status === 'ready') return 'sent';
  if (status === 'accepted' && !readyStep) return 'sent';
  throw BAD_STATE;
}

function onlyFrom(status: OrderStatus, from: OrderStatus, to: OrderStatus): OrderStatus {
  if (status !== from) throw BAD_STATE;
  return to;
}

export type IssueAction = 'flag' | 'substitute' | 'escalate';

const ALREADY_ESCALATED = new DomainException(
  'INVALID_STATE_TRANSITION',
  'ใบงานนี้ส่งให้ POS แล้ว',
  409,
);

export function issueStatus(action: IssueAction, status: OrderStatus, escalated: boolean): OrderStatus {
  if (action === 'flag') return flaggedStatus(status);
  if (status !== 'issue') throw BAD_STATE;
  if (action === 'substitute') return 'accepted';
  if (escalated) throw ALREADY_ESCALATED;
  return 'issue';
}

function flaggedStatus(status: OrderStatus): OrderStatus {
  if (status === 'pending' || status === 'accepted' || status === 'ready') return 'issue';
  throw BAD_STATE;
}
