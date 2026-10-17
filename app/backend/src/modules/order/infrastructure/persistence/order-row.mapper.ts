import {
  readDate,
  readOptionalDate,
  readOptionalText,
  readText,
} from '../../../../common/persistence/row-values.js';
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
    orderId: readText(raw.order_id),
    visitId: readText(raw.visit_id),
    orderNumber: Number(raw.order_number),
    businessDate: readText(raw.business_date).slice(0, 10),
    orderCreatedAt: readDate(raw.order_created_at),
    orderCreatedBy: readOptionalText(raw.order_created_by),
  };
}

function ticketPart(raw: Record<string, unknown>) {
  return {
    ticketId: readText(raw.ticket_id),
    station: readOptionalText(raw.station),
    status: readText(raw.status),
    sentAt: readOptionalDate(raw.sent_at),
    ticketCreatedAt: readDate(raw.ticket_created_at),
    ticketUpdatedAt: readDate(raw.ticket_updated_at),
    ticketUpdatedBy: readOptionalText(raw.ticket_updated_by),
    seatId: readText(raw.seat_id),
    seatLabel: readText(raw.seat_label),
    seatKind: readText(raw.seat_kind),
  };
}

function itemPart(raw: Record<string, unknown>) {
  return {
    itemId: readText(raw.item_id),
    variantId: readText(raw.variant_id),
    itemName: readText(raw.item_name),
    variantName: readText(raw.variant_name),
    quantity: Number(raw.quantity),
    unitPrice: readText(raw.unit_price),
    orderedByName: readOptionalText(raw.ordered_by_name),
    notes: readOptionalText(raw.notes),
    cancelledAt: readOptionalDate(raw.cancelled_at),
    optionId: readOptionalText(raw.option_id),
    optionName: readOptionalText(raw.option_name),
    priceDelta: readOptionalText(raw.price_delta),
  };
}
