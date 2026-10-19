import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import type { EntityManager } from 'typeorm';
import { businessDateLockKey } from '../../application/business-date.js';
import type { OrderRepository } from '../../domain/order.repository.js';
import type {
  BillRow,
  LockedTicket,
  NewOrder,
  NewTicket,
  OrderQuery,
  OrderTotal,
  PricedLine,
  TicketBucket,
} from '../../domain/order.types.js';
import type { OrderRow } from '../../domain/order-row.types.js';
import { OrderItem } from './order-item.entity.js';
import { OrderItemModifier } from './order-item-modifier.entity.js';
import { OrderRecord } from './order.entity.js';
import { OrderTicket } from './order-ticket.entity.js';
import { toOrderRow } from './order-row.mapper.js';
import { orderWhere, rowList } from './order-query.js';
import { BILL_SQL, LOCK_TICKET_SQL, ORDER_ROWS_SQL, ORDER_TOTALS_SQL } from './order.sql.js';

@Injectable()
export class OrderTypeormRepository implements OrderRepository {
  public constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {}

  public async nextNumber(businessDate: string): Promise<number> {
    const key = businessDateLockKey(businessDate);
    // Held until commit so a rollback never skips or duplicates a daily number.
    await this.manager.query(`SELECT pg_advisory_xact_lock($1::bigint)`, [key]);
    const result: unknown = await this.manager.query(NEXT_NUMBER, [businessDate]);
    const row = rowList(result)[0];
    return Number(row?.next ?? 1);
  }

  public async insert(order: NewOrder): Promise<string> {
    const saved = await this.manager.getRepository(OrderRecord).save(this.orderRow(order));
    for (const ticket of order.tickets) {
      await this.insertTicket(saved.id, ticket, order.placedAt);
    }
    return saved.id;
  }

  public async lockTicket(id: string): Promise<LockedTicket | null> {
    const result: unknown = await this.manager.query(LOCK_TICKET_SQL, [id]);
    const row = rowList(result)[0];
    return row ? this.toLocked(row) : null;
  }

  public async saveStatus(
    id: string,
    status: LockedTicket['status'],
    sentAt: Date | null,
  ): Promise<void> {
    const tickets = this.manager.getRepository(OrderTicket);
    const ticket = await tickets.findOne({ where: { id } });
    if (!ticket) return;
    ticket.status = status;
    ticket.sentAt = sentAt;
    await tickets.save(ticket);
  }

  public async rows(query: OrderQuery): Promise<OrderRow[]> {
    const values: unknown[] = [];
    const where = orderWhere(query, values);
    const result: unknown = await this.manager.query(
      `${ORDER_ROWS_SQL} ${where} ORDER BY o.created_at, t.created_at, i.created_at`,
      values,
    );
    return rowList(result).map(toOrderRow);
  }

  public async bills(visitIds: readonly string[]): Promise<BillRow[]> {
    if (visitIds.length === 0) return [];
    const result: unknown = await this.manager.query(BILL_SQL, [visitIds]);
    return rowList(result).map((row) => this.toBill(row));
  }

  public async orderTotals(visitId: string): Promise<OrderTotal[]> {
    const result: unknown = await this.manager.query(ORDER_TOTALS_SQL, [visitId]);
    return rowList(result).map((row) => this.toOrderTotal(row));
  }

  private get manager(): EntityManager {
    return this.txHost.tx;
  }

  private orderRow(order: NewOrder): OrderRecord {
    return this.manager.getRepository(OrderRecord).create({
      visitId: order.visitId,
      orderNumber: order.orderNumber,
      businessDate: order.businessDate,
    });
  }

  private async insertTicket(orderId: string, ticket: NewTicket, placedAt: Date): Promise<void> {
    const saved = await this.manager.getRepository(OrderTicket).save(this.ticketRow(orderId, ticket, placedAt));
    for (const line of ticket.lines) await this.insertItem(saved.id, line);
  }

  private ticketRow(orderId: string, ticket: NewTicket, placedAt: Date): OrderTicket {
    const charge = ticket.bucket === 'charge';
    return this.manager.getRepository(OrderTicket).create({
      orderId,
      station: this.stationColumn(ticket.bucket),
      status: charge ? 'sent' : 'pending',
      sentAt: charge ? placedAt : null,
      issueReason: null,
      issueItemId: null,
      issueNote: null,
      issueReportedBy: null,
      issueEscalatedAt: null,
    });
  }

  private async insertItem(ticketId: string, line: PricedLine): Promise<void> {
    const saved = await this.manager.getRepository(OrderItem).save(this.itemRow(ticketId, line));
    for (const modifier of line.modifiers) await this.insertModifier(saved.id, modifier);
  }

  private itemRow(ticketId: string, line: PricedLine): OrderItem {
    return this.manager.getRepository(OrderItem).create({
      ticketId,
      menuItemVariantId: line.variantId,
      quantity: line.quantity,
      unitPriceSnapshot: line.unitPrice,
      orderedByName: line.orderedByName,
      notes: line.notes,
      cancelledAt: null,
      cancelledBy: null,
      cancelReason: null,
      cancelNote: null,
    });
  }

  private async insertModifier(
    orderItemId: string,
    modifier: PricedLine['modifiers'][number],
  ): Promise<void> {
    const modifiers = this.manager.getRepository(OrderItemModifier);
    await modifiers.save(modifiers.create({
      orderItemId,
      modifierOptionId: modifier.optionId,
      priceDeltaSnapshot: modifier.priceDelta,
    }));
  }

  private stationColumn(bucket: TicketBucket): 'bar' | 'food' | null {
    if (bucket === 'bar' || bucket === 'food') return bucket;
    return null;
  }

  private toLocked(row: Record<string, unknown>): LockedTicket {
    return {
      id: this.required(row.id),
      orderId: this.required(row.order_id),
      visitId: this.required(row.visit_id),
      status: this.statusOf(this.required(row.status)),
      sentAt: row.sent_at instanceof Date ? row.sent_at : null,
      seatKind: this.required(row.seat_kind) === 'counter' ? 'counter' : 'table',
    };
  }

  private required(value: unknown): string {
    if (typeof value !== 'string') throw new Error('order row is missing a string');
    return value;
  }

  private statusOf(value: string): LockedTicket['status'] {
    if (value === 'pending' || value === 'accepted' || value === 'ready' || value === 'sent' || value === 'issue' || value === 'cancelled') {
      return value;
    }
    throw new Error('order row has an unknown status');
  }

  private toBill(row: Record<string, unknown>): BillRow {
    return {
      visitId: this.required(row.visit_id),
      total: this.required(row.total),
      itemCount: Number(row.item_count),
    };
  }

  private toOrderTotal(row: Record<string, unknown>): OrderTotal {
    return { orderId: this.required(row.order_id), total: this.required(row.total) };
  }
}

const NEXT_NUMBER = `
  SELECT COALESCE(MAX(order_number), 0) + 1 AS next
  FROM order_record
  WHERE business_date = $1
`;
