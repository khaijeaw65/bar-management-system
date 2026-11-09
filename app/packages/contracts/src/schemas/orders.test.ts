import { TicketIssueEscalatedPayloadSchema, TicketStatusChangedPayloadSchema } from '../events/order.js';
import { ErrorCodeSchema } from './errors.js';
import { OrderStatusSchema } from './enums.js';
import {
  AdjustItemRequestSchema,
  FlagIssueRequestSchema,
  OrderLineSchema,
  PlaceOrderRequestSchema,
  TicketSchema,
} from './orders.js';

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
          cancellation: null,
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

  it('requires updatedAt on ticket events so a client can drop an older one', () => {
    const body = {
      ticketId: id,
      orderId: id,
      visitId: id,
      status: 'accepted',
      updatedBy: { staffId: id, displayName: 'เอ' },
    };
    expect(TicketStatusChangedPayloadSchema.safeParse(body).success).toBe(false);
    expect(
      TicketStatusChangedPayloadSchema.safeParse({ ...body, updatedAt: '2026-10-21T10:00:00.000Z' }).success,
    ).toBe(true);
    expect(
      TicketIssueEscalatedPayloadSchema.safeParse({
        ticketId: id,
        orderId: id,
        visitId: id,
        orderNumber: 1,
        seatLabel: 'T1',
        reason: 'out_of_stock',
        escalatedAt: '2026-10-21T10:00:00.000Z',
        escalatedBy: { staffId: id, displayName: 'เอ' },
      }).success,
    ).toBe(false);
  });

  it('validates AdjustItemRequestSchema with reasons, note requirement, and 4-digit PIN', () => {
    expect(AdjustItemRequestSchema.safeParse({ reason: 'out_of_stock' }).success).toBe(true);
    expect(AdjustItemRequestSchema.safeParse({ reason: 'wrong_order', pin: '1234' }).success).toBe(true);
    expect(AdjustItemRequestSchema.safeParse({ reason: 'wrong_order', pin: '123' }).success).toBe(false);
    expect(AdjustItemRequestSchema.safeParse({ reason: 'wrong_order', pin: 'abcd' }).success).toBe(false);
    expect(AdjustItemRequestSchema.safeParse({ reason: 'other' }).success).toBe(false);
    expect(AdjustItemRequestSchema.safeParse({ reason: 'other', note: '   ' }).success).toBe(false);
    expect(AdjustItemRequestSchema.safeParse({ reason: 'other', note: 'โปรโมชั่นพิเศษ' }).success).toBe(true);
  });

  it('parses voided and comped order lines', () => {
    const voided = OrderLineSchema.parse({
      id,
      variantId: id,
      name: 'เบียร์สิงห์',
      variantName: 'ขวด',
      quantity: 1,
      unitPrice: '120.00',
      modifiers: [],
      lineTotal: '120.00',
      orderedByName: null,
      notes: null,
      cancelledAt: '2026-10-31T12:00:00.000Z',
      cancellation: {
        at: '2026-10-31T12:00:00.000Z',
        reason: 'wrong_order',
        by: { staffId: id, displayName: 'สมชาย' },
        system: false,
        approvedBy: { staffId: id, displayName: 'ผู้จัดการ' },
        selfApproved: false,
      },
    });
    expect(voided.cancellation?.approvedBy?.displayName).toBe('ผู้จัดการ');
    expect(voided.comp).toBeNull();

    const comped = OrderLineSchema.parse({
      id,
      variantId: id,
      name: 'โมฮิโต้',
      variantName: 'แก้ว',
      quantity: 1,
      unitPrice: '180.00',
      modifiers: [],
      lineTotal: '0.00',
      orderedByName: null,
      notes: null,
      cancelledAt: null,
      cancellation: null,
      comp: {
        at: '2026-10-31T12:05:00.000Z',
        by: { staffId: id, displayName: 'สมชาย' },
        approvedBy: null,
        selfApproved: true,
        reason: 'special_service',
        note: null,
      },
    });
    expect(comped.comp?.selfApproved).toBe(true);
    expect(comped.lineTotal).toBe('0.00');
  });
});
