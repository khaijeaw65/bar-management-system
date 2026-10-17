import type { OrderRow } from '../../domain/order-row.types.js';

export function toOrderRow(raw: Record<string, unknown>): OrderRow {
  return {
    ...orderPart(raw),
    ...ticketPart(raw),
    ...itemPart(raw),
  };
}

function orderPart(raw: Record<string, unknown>) {
  return {
    orderId: text(raw.order_id),
    visitId: text(raw.visit_id),
    orderNumber: Number(raw.order_number),
    businessDate: text(raw.business_date).slice(0, 10),
    orderCreatedAt: asDate(raw.order_created_at),
    orderCreatedBy: optionalText(raw.order_created_by),
  };
}

function ticketPart(raw: Record<string, unknown>) {
  return {
    ticketId: text(raw.ticket_id),
    station: optionalText(raw.station),
    status: text(raw.status),
    sentAt: optionalDate(raw.sent_at),
    ticketCreatedAt: asDate(raw.ticket_created_at),
    ticketUpdatedAt: asDate(raw.ticket_updated_at),
    ticketUpdatedBy: optionalText(raw.ticket_updated_by),
    seatId: text(raw.seat_id),
    seatLabel: text(raw.seat_label),
    seatKind: text(raw.seat_kind),
  };
}

function itemPart(raw: Record<string, unknown>) {
  return {
    itemId: text(raw.item_id),
    variantId: text(raw.variant_id),
    itemName: text(raw.item_name),
    variantName: text(raw.variant_name),
    quantity: Number(raw.quantity),
    unitPrice: text(raw.unit_price),
    orderedByName: optionalText(raw.ordered_by_name),
    notes: optionalText(raw.notes),
    cancelledAt: optionalDate(raw.cancelled_at),
    optionId: optionalText(raw.option_id),
    optionName: optionalText(raw.option_name),
    priceDelta: optionalText(raw.price_delta),
  };
}

function text(value: unknown): string {
  if (typeof value !== 'string') throw new Error('order row is missing a string');
  return value;
}

function optionalText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return text(value);
}

function asDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  throw new Error('order row is missing a timestamp');
}

function optionalDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  return asDate(value);
}
