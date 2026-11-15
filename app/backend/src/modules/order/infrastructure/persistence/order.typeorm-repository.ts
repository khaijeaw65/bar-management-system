import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import type { EntityManager } from 'typeorm';
import { businessDateLockKey } from '../../../../common/business-date.js';
import type { OrderRepository } from '../../domain/order.repository.js';
import type {
  BillRow,
  LineAdjustmentWrite,
  LockedItemAdjustment,
  LockedTicket,
  NewOrder,
  NewTicket,
  OrderQuery,
  OrderTotal,
  PendingItemLine,
  PricedLine,
  TicketBucket,
  TicketIssueWrite,
  TicketLineState,
} from '../../domain/order.types.js';
import type { OrderRow } from '../../domain/order-row.types.js';
import { OrderItem } from './order-item.entity.js';
import { OrderItemModifier } from './order-item-modifier.entity.js';
import { OrderRecord } from './order.entity.js';
import { OrderTicket } from './order-ticket.entity.js';
import {
  readOptionalDate,
  readOptionalText,
} from '../../../../common/persistence/row-values.js';
import { toOrderRow } from './order-row.mapper.js';
import { orderWhere, rowList } from './order-query.js';
import {
  ACTIVE_LINE_COUNT_SQL,
  BILL_SQL,
  GUEST_SESSION_IDS_SQL,
  LINE_ON_TICKET_SQL,
  LOCK_ITEM_ADJUSTMENT_SQL,
  LOCK_TICKET_SQL,
  ORDER_ROWS_SQL,
  ORDER_TOTALS_SQL,
  PAYMENT_STATUS_MOVING_SQL,
  PENDING_ITEM_LINES_SQL,
  PENDING_PAYMENT_SQL,
} from './order.sql.js';

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

  public async saveIssue(id: string, issue: TicketIssueWrite): Promise<void> {
    const tickets = this.manager.getRepository(OrderTicket);
    const ticket = await tickets.findOne({ where: { id } });
    if (!ticket) return;
    this.applyIssue(ticket, issue);
    await tickets.save(ticket);
  }

  public async lineOnTicket(ticketId: string, itemId: string): Promise<TicketLineState> {
    const result: unknown = await this.manager.query(LINE_ON_TICKET_SQL, [ticketId, itemId]);
    const row = rowList(result)[0];
    if (!row) return 'missing';
    return row.cancelled_at ? 'cancelled' : 'active';
  }

  public async rows(query: OrderQuery): Promise<OrderRow[]> {
    const values: unknown[] = [];
    const where = orderWhere(query, values);
    const result: unknown = await this.manager.query(
      `${ORDER_ROWS_SQL} ${where} ORDER BY o.created_at, o.id, t.created_at, t.station, t.id, i.line_no, m.id`,
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

  public async guestSessionIds(visitId: string): Promise<Map<string, string>> {
    const result: unknown = await this.manager.query(GUEST_SESSION_IDS_SQL, [visitId]);
    return new Map(rowList(result).map((row) => [this.required(row.id), this.required(row.guest_session_id)]));
  }

  public async pendingLinesForItem(menuItemId: string): Promise<PendingItemLine[]> {
    const result: unknown = await this.manager.query(PENDING_ITEM_LINES_SQL, [menuItemId]);
    return rowList(result).map((row) => this.toPendingLine(row));
  }

  public async hasPendingPayment(visitId: string): Promise<boolean> {
    const result: unknown = await this.manager.query(PENDING_PAYMENT_SQL, [visitId]);
    return rowList(result).length > 0;
  }

  public async cancelLines(ids: readonly string[], at: Date, reason: string): Promise<void> {
    const items = this.manager.getRepository(OrderItem);
    for (const id of ids) {
      const item = await items.findOne({ where: { id } });
      if (!item || item.cancelledAt) continue;
      item.cancelledAt = at;
      item.cancelledBy = null;
      item.cancelReason = reason;
      item.cancelKind = 'void';
      await items.save(item);
    }
  }

  public async countActiveLines(ticketId: string): Promise<number> {
    const result: unknown = await this.manager.query(ACTIVE_LINE_COUNT_SQL, [ticketId]);
    return Number(rowList(result)[0]?.count ?? 0);
  }

  public async lockItemForAdjustment(itemId: string): Promise<LockedItemAdjustment | null> {
    const rows = rowList(await this.manager.query(LOCK_ITEM_ADJUSTMENT_SQL, [itemId]));
    const row = rows[0];
    if (!row) return null;
    return {
      itemId: String(row.item_id),
      ticketId: String(row.ticket_id),
      orderId: String(row.order_id),
      visitId: String(row.visit_id),
      visitState: String(row.visit_state),
      cancelledAt: readOptionalDate(row.cancelled_at),
      cancelKind: (readOptionalText(row.cancel_kind) as 'void' | 'comp' | null) ?? null,
    };
  }

  public async paymentStatusOnVisit(visitId: string): Promise<'pending' | 'completed' | null> {
    const rows = rowList(await this.manager.query(PAYMENT_STATUS_MOVING_SQL, [visitId]));
    if (rows.some((r) => r.status === 'pending')) return 'pending';
    if (rows.some((r) => r.status === 'completed')) return 'completed';
    return null;
  }

  public async adjustLine(input: LineAdjustmentWrite): Promise<void> {
    const items = this.manager.getRepository(OrderItem);
    const item = await items.findOne({ where: { id: input.itemId } });
    if (!item) throw new Error('item not found');
    item.cancelledAt = input.at;
    item.cancelledBy = input.cancelledBy;
    item.cancelReason = input.reason;
    item.cancelNote = input.note;
    item.cancelKind = input.kind;
    item.approvedBy = input.approvedBy;
    await items.save(item);
  }

  private get manager(): EntityManager {
    return this.txHost.tx;
  }

  private orderRow(order: NewOrder): OrderRecord {
    return this.manager.getRepository(OrderRecord).create({
      visitId: order.visitId,
      orderNumber: order.orderNumber,
      businessDate: order.businessDate,
      guestSessionId: order.guestSessionId ?? null,
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
      itemNameSnapshot: line.itemName,
      variantNameSnapshot: line.variantName,
      lineNo: line.lineNo,
      quantity: line.quantity,
      unitPriceSnapshot: line.unitPrice,
      orderedByName: line.orderedByName,
      notes: line.notes,
      cancelledAt: null,
      cancelledBy: null,
      cancelReason: null,
      cancelNote: null,
      cancelKind: null,
      approvedBy: null,
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
      optionNameSnapshot: modifier.name,
      priceDeltaSnapshot: modifier.priceDelta,
    }));
  }

  private applyIssue(ticket: OrderTicket, issue: TicketIssueWrite): void {
    ticket.status = issue.status;
    ticket.issueReason = issue.reason;
    ticket.issueItemId = issue.itemId;
    ticket.issueNote = issue.note;
    ticket.issueReportedBy = issue.reportedBy;
    ticket.issueEscalatedAt = issue.escalatedAt;
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
      issueReason: readOptionalText(row.issue_reason),
      issueItemId: readOptionalText(row.issue_item_id),
      issueNote: readOptionalText(row.issue_note),
      issueReportedBy: readOptionalText(row.issue_reported_by),
      issueEscalatedAt: readOptionalDate(row.issue_escalated_at),
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

  private toPendingLine(row: Record<string, unknown>): PendingItemLine {
    return {
      itemId: this.required(row.item_id),
      quantity: Number(row.quantity),
      ticketId: this.required(row.ticket_id),
      ticketStatus: this.statusOf(this.required(row.ticket_status)),
      visitId: this.required(row.visit_id),
      orderNumber: Number(row.order_number),
      seatLabel: this.required(row.seat_label),
    };
  }
}

const NEXT_NUMBER = `
  SELECT COALESCE(MAX(order_number), 0) + 1 AS next
  FROM order_record
  WHERE business_date = $1
`;
