import { ErrorCodeSchema } from './errors.js';
import { OrderStatusSchema } from './enums.js';
import { FlagIssueRequestSchema, PlaceOrderRequestSchema, TicketSchema } from './orders.js';

const id = '11111111-1111-4111-8111-111111111111';

describe('order contracts', () => {
  it('adds ITEM_UNAVAILABLE and keeps the six ticket statuses', () => {
    expect(ErrorCodeSchema.options).toContain('ITEM_UNAVAILABLE');
    expect(OrderStatusSchema.options).toEqual([
      'pending',
      'accepted',
      'ready',
      'sent',
      'issue',
      'cancelled',
    ]);
  });

  it('rejects an empty order and a quantity above 99', () => {
    expect(PlaceOrderRequestSchema.safeParse({ items: [] }).success).toBe(false);
    expect(
      PlaceOrderRequestSchema.safeParse({
        items: [{ variantId: id, quantity: 100 }],
      }).success,
    ).toBe(false);
  });

  it('parses a charge ticket', () => {
    const ticket = TicketSchema.parse({
      id,
      orderId: id,
      orderNumber: 1,
      station: null,
      status: 'sent',
      seat: { id, label: 'T1', kind: 'table' },
      items: [
        {
          id,
          variantId: id,
          name: 'ค่าเปิดขวด',
          variantName: 'ปกติ',
          quantity: 1,
          unitPrice: '300.00',
          modifiers: [],
          lineTotal: '300.00',
          orderedByName: null,
          notes: null,
          cancelledAt: null,
        },
      ],
      issue: null,
      acceptedBy: null,
      sentAt: '2026-10-17T12:00:00.000Z',
      createdAt: '2026-10-17T12:00:00.000Z',
      updatedAt: '2026-10-17T12:00:00.000Z',
    });
    expect(ticket.station).toBeNull();
    expect(ticket.issue).toBeNull();
  });

  it('requires a note when the issue reason is other', () => {
    expect(FlagIssueRequestSchema.safeParse({ reason: 'other' }).success).toBe(false);
    expect(FlagIssueRequestSchema.safeParse({ reason: 'other', note: '  ' }).success).toBe(false);
    expect(FlagIssueRequestSchema.safeParse({ reason: 'equipment' }).success).toBe(true);
    expect(FlagIssueRequestSchema.safeParse({ reason: 'other', note: 'เครื่องเสีย' }).success).toBe(true);
  });
});
