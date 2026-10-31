import { TransactionHost } from '@nestjs-cls/transactional';
import { TICKET_ISSUE_ESCALATED } from '@bar/contracts';
import { DomainException } from '../../../common/domain-exception.js';
import type { OrderRepository } from '../domain/order.repository.js';
import type { LockedTicket } from '../domain/order.types.js';
import type { OrderQueryService } from './order-query.service.js';
import type { TicketView } from './present-order.js';
import { TicketService } from './ticket.service.js';
import { nextTicketStatus, readyStepApplies } from './ticket-transition.js';

describe('ticket transitions', () => {
  it('allows READY only for a table when the kitchen screen is on', () => {
    expect(readyStepApplies(true, 'table')).toBe(true);
    expect(readyStepApplies(true, 'counter')).toBe(false);
    expect(readyStepApplies(false, 'table')).toBe(false);
  });

  it('accepts pending, then ready only when that step applies', () => {
    expect(nextTicketStatus('accept', 'pending', true)).toBe('accepted');
    expect(nextTicketStatus('ready', 'accepted', true)).toBe('ready');
    expect(nextTicketStatus('send', 'ready', true)).toBe('sent');
    expect(() => nextTicketStatus('ready', 'accepted', false)).toThrow(DomainException);
  });

  it('sends from accepted when READY is skipped, and refuses it when READY applies', () => {
    expect(nextTicketStatus('send', 'accepted', false)).toBe('sent');
    expect(() => nextTicketStatus('send', 'accepted', true)).toThrow(DomainException);
    expect(() => nextTicketStatus('accept', 'accepted', false)).toThrow(DomainException);
  });
});

describe('TicketService escalate event', () => {
  const ticketId = '11111111-1111-4111-8111-111111111111';
  const orderId = '22222222-2222-4222-8222-222222222222';
  const visitId = '33333333-3333-4333-8333-333333333333';
  const staffId = '44444444-4444-4444-8444-444444444444';
  const at = new Date('2026-10-21T10:00:00.000Z');

  beforeAll(() => {
    new TransactionHost({
      wrapWithTransaction: async (_options: unknown, fn: () => Promise<unknown>) => fn(),
      getFallbackInstance: () => ({}),
    } as never);
  });

  it('emits the escalate that was written when a later read no longer has the issue', async () => {
    let reads = 0;
    const events: unknown[] = [];
    const orders = {
      lockTicket: async (): Promise<LockedTicket> => ({
        id: ticketId,
        orderId,
        visitId,
        status: 'issue',
        sentAt: null,
        seatKind: 'table',
        issueReason: 'equipment',
        issueItemId: null,
        issueNote: null,
        issueReportedBy: staffId,
        issueEscalatedAt: null,
      }),
      saveIssue: async () => undefined,
    };
    const query = {
      ticketById: async (): Promise<TicketView> => {
        reads += 1;
        if (reads > 1) throw new Error('escalated ticket is missing its issue');
        return {
          id: ticketId,
          orderId,
          visitId,
          orderNumber: 4,
          status: 'issue',
          seat: { id: visitId, label: 'T4', kind: 'table' },
          updatedAt: '2026-10-21T10:00:01.000Z',
          issue: null,
        } as TicketView;
      },
    };
    const service = new TicketService(
      orders as unknown as OrderRepository,
      { now: () => at },
      { get: async () => ({ kitchenDisplayEnabled: false }) } as never,
      query as unknown as OrderQueryService,
      { findById: async () => ({ displayName: 'เอ' }) } as never,
      {
        emitToStaff: (event: string, payload: unknown) => events.push({ event, payload }),
        emitTabChanged: () => undefined,
      } as never,
      { foodReady: async () => [] } as never,
    );

    await expect(service.resolveIssue(ticketId, staffId, { resolution: 'escalate' })).resolves.toMatchObject({
      id: ticketId,
    });
    expect(reads).toBe(1);
    expect(events).toEqual([
      {
        event: TICKET_ISSUE_ESCALATED,
        payload: expect.objectContaining({
          ticketId,
          reason: 'equipment',
          escalatedAt: '2026-10-21T10:00:00.000Z',
          updatedAt: '2026-10-21T10:00:01.000Z',
          seatLabel: 'T4',
          escalatedBy: { staffId, displayName: 'เอ' },
        }),
      },
    ]);
  });
});
