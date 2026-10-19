import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import type { EntityManager } from 'typeorm';
import { readText } from '../../../../common/persistence/row-values.js';
import type { PaymentRepository } from '../../domain/ports/payment.repository.port.js';
import type { NewPayment, PaymentRecord } from '../../domain/payment.types.js';
import { PaymentOrderLink } from './payment-order.entity.js';
import { Payment } from './payment.entity.js';

const LOCK_PAYMENT = `SELECT id FROM payment WHERE id = $1 FOR UPDATE`;
const COVERED_ORDERS = `
  SELECT po.order_id
  FROM payment_order po
  JOIN payment p ON p.id = po.payment_id
  WHERE p.visit_id = $1 AND p.status = 'completed'
`;
const PENDING_VISITS = `
  SELECT DISTINCT visit_id
  FROM payment
  WHERE status = 'pending' AND visit_id = ANY($1::uuid[])
`;

@Injectable()
export class PaymentTypeormRepository implements PaymentRepository {
  public constructor(private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>) {}

  public async insert(payment: NewPayment, orderIds: readonly string[]): Promise<PaymentRecord> {
    const saved = await this.payments.save(this.payments.create(payment));
    for (const orderId of orderIds) await this.link(saved.id, orderId);
    return this.toRecord(saved);
  }

  public async lockById(id: string): Promise<PaymentRecord | null> {
    const locked = await this.manager.query(LOCK_PAYMENT, [id]);
    if (!this.firstId(locked)) return null;
    return this.findById(id);
  }

  public async save(payment: PaymentRecord): Promise<PaymentRecord> {
    const entity = await this.payments.findOneBy({ id: payment.id });
    if (!entity) throw new Error('payment row missing');
    this.apply(entity, payment);
    return this.toRecord(await this.payments.save(entity));
  }

  public async findById(id: string): Promise<PaymentRecord | null> {
    const entity = await this.payments.findOneBy({ id });
    return entity ? this.toRecord(entity) : null;
  }

  public async findPendingByVisit(visitId: string): Promise<PaymentRecord | null> {
    const entity = await this.payments.findOne({ where: { visitId, status: 'pending' } });
    return entity ? this.toRecord(entity) : null;
  }

  public async listByVisit(visitId: string): Promise<PaymentRecord[]> {
    const rows = await this.payments.find({ where: { visitId }, order: { createdAt: 'ASC', partNo: 'ASC' } });
    return rows.map((row) => this.toRecord(row));
  }

  public async coveredOrderIds(visitId: string): Promise<string[]> {
    const rows: unknown = await this.manager.query(COVERED_ORDERS, [visitId]);
    return this.ids(rows, 'order_id');
  }

  public async pendingVisitIds(visitIds: readonly string[]): Promise<string[]> {
    if (visitIds.length === 0) return [];
    const rows: unknown = await this.manager.query(PENDING_VISITS, [visitIds]);
    return this.ids(rows, 'visit_id');
  }

  private async link(paymentId: string, orderId: string): Promise<void> {
    const links = this.manager.getRepository(PaymentOrderLink);
    await links.save(links.create({ paymentId, orderId }));
  }

  private apply(entity: Payment, payment: PaymentRecord): void {
    entity.status = payment.status;
    entity.confirmedVia = payment.confirmedVia;
    entity.statusReason = payment.statusReason;
    entity.statusNote = payment.statusNote;
    entity.paidAt = payment.paidAt;
  }

  private toRecord(entity: Payment): PaymentRecord {
    return {
      id: entity.id,
      attemptId: entity.attemptId,
      visitId: entity.visitId,
      partNo: Number(entity.partNo),
      partCount: Number(entity.partCount),
      amount: entity.amount,
      method: entity.method,
      status: entity.status,
      confirmedVia: entity.confirmedVia,
      statusReason: entity.statusReason,
      statusNote: entity.statusNote,
      qrPayload: entity.qrPayload,
      expiresAt: entity.expiresAt,
      paidAt: entity.paidAt,
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy,
      createdAt: entity.createdAt,
    };
  }

  private ids(rows: unknown, column: string): string[] {
    if (!Array.isArray(rows)) return [];
    return rows.map((row) => readText((row as Record<string, unknown>)[column]));
  }

  private firstId(rows: unknown): string | null {
    if (!Array.isArray(rows) || rows.length === 0) return null;
    const row = rows[0] as Record<string, unknown>;
    return typeof row.id === 'string' ? row.id : null;
  }

  private get payments() {
    return this.manager.getRepository(Payment);
  }

  private get manager(): EntityManager {
    return this.txHost.tx;
  }
}
