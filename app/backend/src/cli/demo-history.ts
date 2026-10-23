import { randomUUID } from 'node:crypto';
import type { DataSource, EntityManager } from 'typeorm';
import { addDays, businessDate } from '../common/business-date.js';
import { fromSatang, toSatang } from '../common/money.js';
import { OrderItem } from '../modules/order/infrastructure/persistence/order-item.entity.js';
import { OrderTicket } from '../modules/order/infrastructure/persistence/order-ticket.entity.js';
import { OrderRecord } from '../modules/order/infrastructure/persistence/order.entity.js';
import { PaymentOrderLink } from '../modules/payment/infrastructure/persistence/payment-order.entity.js';
import { Payment } from '../modules/payment/infrastructure/persistence/payment.entity.js';
import { Visit } from '../modules/venue/infrastructure/persistence/visit.entity.js';
import { planDay } from './demo-history-plan.js';
import type {
  AuditStamp,
  DemoCatalog,
  DemoDay,
  DemoHistoryResult,
  DemoItemContext,
  DemoLine,
  DemoOrderWrite,
  DemoPaymentWrite,
  DemoTicketWrite,
  DemoVisitWrite,
} from './demo-history.types.js';

/** Every seeded visit carries this guest label; a re-run deletes exactly these rows first. */
export const DEMO_HISTORY_TAG = 'demo-history';
export const DEMO_HISTORY_DAYS = 30;
export const demoHistoryEntities = [Visit, OrderRecord, OrderTicket, OrderItem, Payment, PaymentOrderLink];

const MINUTE_MS = 60_000;
const TAGGED_VISITS = `SELECT id FROM visit WHERE guest_label = $1`;
const TAGGED_ORDERS = `SELECT id FROM order_record WHERE visit_id IN (${TAGGED_VISITS})`;
const TAGGED_TICKETS = `SELECT id FROM order_ticket WHERE order_id IN (${TAGGED_ORDERS})`;
const TAGGED_PAYMENTS = `SELECT id FROM payment WHERE visit_id IN (${TAGGED_VISITS})`;
const CLEAR_SQL = [
  `DELETE FROM payment_order WHERE payment_id IN (${TAGGED_PAYMENTS})`,
  `DELETE FROM payment_charge_item WHERE payment_id IN (${TAGGED_PAYMENTS})`,
  `DELETE FROM payment WHERE visit_id IN (${TAGGED_VISITS})`,
  `UPDATE order_ticket SET issue_item_id = NULL WHERE order_id IN (${TAGGED_ORDERS})`,
  `DELETE FROM order_item_modifier WHERE order_item_id IN (SELECT id FROM order_item WHERE ticket_id IN (${TAGGED_TICKETS}))`,
  `DELETE FROM order_item WHERE ticket_id IN (${TAGGED_TICKETS})`,
  `DELETE FROM order_ticket WHERE order_id IN (${TAGGED_ORDERS})`,
  `DELETE FROM order_record WHERE visit_id IN (${TAGGED_VISITS})`,
  `DELETE FROM visit WHERE guest_label = $1`,
];

export function assertDemoSeedAllowed(nodeEnv: string): void {
  if (nodeEnv !== 'production') return;
  throw new Error('seed:demo-history refuses to run with NODE_ENV=production (dev-only demo data).');
}

/** Replaces the previous demo history: 30 business days ending yesterday. */
export async function seedDemoHistory(dataSource: DataSource, now: Date): Promise<DemoHistoryResult> {
  const catalog = await loadCatalog(dataSource);
  const dates = await historyDates(dataSource, now);
  await dataSource.transaction(async (manager) => {
    for (const sql of CLEAR_SQL) await manager.query(sql, [DEMO_HISTORY_TAG]);
    for (const date of dates) await writeDay(manager, planDay(date, catalog), catalog.staffId);
  });
  return countDemoHistory(dataSource);
}

export async function countDemoHistory(dataSource: DataSource): Promise<DemoHistoryResult> {
  const [row] = await dataSource.query(
    `SELECT count(DISTINCT o.business_date)::int AS days,
            count(DISTINCT v.id)::int AS visits,
            count(DISTINCT p.id)::int AS payments
     FROM visit v
     LEFT JOIN order_record o ON o.visit_id = v.id
     LEFT JOIN payment p ON p.visit_id = v.id
     WHERE v.guest_label = $1`,
    [DEMO_HISTORY_TAG],
  );
  return { days: row.days, visits: row.visits, payments: row.payments };
}

async function loadCatalog(dataSource: DataSource): Promise<DemoCatalog> {
  const staff = await dataSource.query(`SELECT id FROM staff_user WHERE is_active ORDER BY created_at LIMIT 1`);
  const seats = await dataSource.query(`SELECT id FROM table_seat WHERE is_active ORDER BY sort_order, label`);
  const variants = await dataSource.query(
    `SELECT v.id, mi.name AS "itemName", v.name AS "variantName", v.price::text AS price, mi.kitchen_tag AS station
     FROM menu_item_variant v
     JOIN menu_item mi ON mi.id = v.menu_item_id
     WHERE mi.item_type <> 'charge' AND mi.is_available AND v.is_available
     ORDER BY mi.sort_order, mi.name, v.price`,
  );
  if (!staff[0] || seats.length === 0 || variants.length === 0) {
    throw new Error('seed:demo-history needs staff, seats and menu — run seed:staff, seed:venue, seed:menu first.');
  }
  return { staffId: staff[0].id, seatIds: seats.map((seat: { id: string }) => seat.id), variants };
}

async function historyDates(dataSource: DataSource, now: Date): Promise<string[]> {
  const [venue] = await dataSource.query(
    `SELECT business_day_cutoff::text AS cutoff FROM venue ORDER BY created_at LIMIT 1`,
  );
  if (!venue) throw new Error('seed:demo-history needs a venue — run seed:venue first.');
  const yesterday = addDays(businessDate(now, venue.cutoff), -1);
  return Array.from({ length: DEMO_HISTORY_DAYS }, (_, index) =>
    addDays(yesterday, index - DEMO_HISTORY_DAYS + 1),
  );
}

async function writeDay(manager: EntityManager, day: DemoDay, staffId: string): Promise<void> {
  const [row] = await manager.query(
    `SELECT COALESCE(MAX(order_number), 0)::int AS last FROM order_record WHERE business_date = $1`,
    [day.businessDate],
  );
  let orderNumber: number = row.last + 1;
  for (const visit of day.visits) {
    orderNumber = await writeVisit(manager, { businessDate: day.businessDate, visit, staffId, orderNumber });
  }
}

/** Returns the next free order number of the day. */
async function writeVisit(manager: EntityManager, input: DemoVisitWrite): Promise<number> {
  const { visit, staffId } = input;
  const saved = await manager.getRepository(Visit).save({
    tableSeatId: visit.seatId,
    customerId: null,
    state: 'closed' as const,
    guestLabel: DEMO_HISTORY_TAG,
    openedBy: staffId,
    openedVia: 'pos' as const,
    openedAt: visit.openedAt,
    closedAt: visit.closedAt,
  });
  const orderIds: string[] = [];
  for (const [index, order] of visit.orders.entries()) {
    const orderNumber = input.orderNumber + index;
    orderIds.push(await writeOrder(manager, { ...input, visitId: saved.id, order, orderNumber }));
  }
  await writePayment(manager, { ...input, visitId: saved.id }, orderIds);
  return input.orderNumber + visit.orders.length;
}

async function writeOrder(manager: EntityManager, input: DemoOrderWrite): Promise<string> {
  const stamp = audited(input.staffId, input.order.at);
  const order = await manager.getRepository(OrderRecord).save({
    ...stamp,
    visitId: input.visitId,
    orderNumber: input.orderNumber,
    businessDate: input.businessDate,
  });
  for (const station of new Set(input.order.lines.map((line) => line.variant.station))) {
    const lines = input.order.lines.filter((line) => line.variant.station === station);
    await writeTicket(manager, { ...input, orderId: order.id, station, lines });
  }
  return order.id;
}

async function writeTicket(manager: EntityManager, input: DemoTicketWrite): Promise<void> {
  const at = input.order.at;
  const allCancelled = input.lines.every((line) => line.cancelled);
  const ticket = await manager.getRepository(OrderTicket).save({
    ...audited(input.staffId, at),
    orderId: input.orderId,
    station: input.station,
    status: allCancelled ? ('cancelled' as const) : ('sent' as const),
    sentAt: allCancelled ? null : new Date(at.getTime() + 8 * MINUTE_MS),
  });
  await manager.getRepository(OrderItem).save(
    input.lines.map((line) =>
      orderItem(line, { ticketId: ticket.id, lineNo: input.order.lines.indexOf(line) + 1, staffId: input.staffId, at }),
    ),
  );
}

function orderItem(line: DemoLine, context: DemoItemContext): Partial<OrderItem> {
  const cancelledAt = line.cancelled ? new Date(context.at.getTime() + 5 * MINUTE_MS) : null;
  return {
    ...audited(context.staffId, context.at),
    ticketId: context.ticketId,
    menuItemVariantId: line.variant.id,
    itemNameSnapshot: line.variant.itemName,
    variantNameSnapshot: line.variant.variantName,
    lineNo: context.lineNo,
    quantity: line.quantity,
    unitPriceSnapshot: line.variant.price,
    cancelledAt,
    cancelledBy: line.cancelled ? context.staffId : null,
    cancelReason: line.cancelled ? 'สั่งผิด' : null,
  };
}

/** A visit whose every line was cancelled closes as a ฿0 bill with no payment. */
async function writePayment(
  manager: EntityManager,
  input: DemoPaymentWrite,
  orderIds: readonly string[],
): Promise<void> {
  const amount = visitTotal(input.visit.orders.flatMap((order) => order.lines));
  if (amount === '0.00') return;
  const paidAt = new Date(input.visit.closedAt.getTime() - 2 * MINUTE_MS);
  const payment = await manager.getRepository(Payment).save({
    ...audited(input.staffId, new Date(paidAt.getTime() - 3 * MINUTE_MS)),
    visitId: input.visitId,
    attemptId: randomUUID(),
    amount,
    method: input.visit.payment.method,
    status: 'completed' as const,
    confirmedVia: input.visit.payment.confirmedVia,
    paidAt,
  });
  await manager.getRepository(PaymentOrderLink).save(orderIds.map((orderId) => ({ paymentId: payment.id, orderId })));
}

function visitTotal(lines: readonly DemoLine[]): string {
  const active = lines.filter((line) => !line.cancelled);
  return fromSatang(active.reduce((sum, line) => sum + toSatang(line.variant.price) * line.quantity, 0));
}

/**
 * The CLI runs without Nest, so AuditSubscriber is not there to stamp the actor;
 * the seeded staff member is set here instead (BRIEF-036 — created_by = seeded staff).
 */
function audited(staffId: string, at: Date): AuditStamp {
  return { createdBy: staffId, updatedBy: staffId, createdAt: at, updatedAt: at };
}
