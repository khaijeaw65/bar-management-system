import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import type { TableSeatKind } from '@bar/contracts';
import { In, QueryFailedError, type Repository } from 'typeorm';
import { ITableSeatAdminRepository } from '../../domain/table-seat-admin.repository.js';
import { DuplicateSeatLabelError } from '../../domain/table-seat.errors.js';
import type {
  CreateSeatRecordInput,
  SeatAdminRecord,
  SeatSortOrderItem,
  UpdateSeatRecordInput,
} from '../../domain/table-seat.types.js';
import { readText } from '../../../../common/persistence/row-values.js';
import { TableSeat } from './table-seat.entity.js';
import type { SeatAdminRow } from './table-seat.types.js';

const SEAT_LABEL_INDEX = 'uq_table_seat_label_active';

const ADMIN_SELECT = `
  SELECT s.id, s.label, s.kind, s.sort_order, s.is_active, s.qr_token,
         CASE WHEN v.id IS NOT NULL THEN true ELSE false END AS has_live_visit
  FROM table_seat s LEFT JOIN visit v ON v.table_seat_id = s.id AND v.state IN ('open', 'active', 'idle')
`;

const ADMIN_SEATS = `${ADMIN_SELECT} ORDER BY CASE s.kind WHEN 'counter' THEN 0 ELSE 1 END, s.sort_order, s.label`;
const ADMIN_SEAT_BY_ID = `${ADMIN_SELECT} WHERE s.id = $1`;
const ACTIVE_SEAT_BY_LABEL = `${ADMIN_SELECT} WHERE s.is_active = true AND lower(trim(s.label)) = lower(trim($1)) AND ($2::uuid IS NULL OR s.id != $2)`;
const ADMIN_SEATS_BY_KIND = `${ADMIN_SELECT} WHERE s.kind = $1::table_seat_kind ORDER BY s.sort_order, s.label`;
const MAX_SORT_ORDER = `SELECT COALESCE(MAX(sort_order), -1) AS max_sort_order FROM table_seat WHERE kind = $1::table_seat_kind`;

@Injectable()
export class TableSeatAdminTypeormRepository implements ITableSeatAdminRepository {
  public constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {}

  public async listAdmin(): Promise<SeatAdminRecord[]> {
    const rows: SeatAdminRow[] = await this.txHost.tx.query(ADMIN_SEATS);
    return rows.map((row) => this.toAdminSeat(row));
  }

  public async findAdminById(id: string): Promise<SeatAdminRecord | null> {
    const rows: SeatAdminRow[] = await this.txHost.tx.query(ADMIN_SEAT_BY_ID, [id]);
    const row = rows[0];
    if (!row) return null;
    return this.toAdminSeat(row);
  }

  public async findActiveByLabel(label: string, excludeId?: string): Promise<SeatAdminRecord | null> {
    const rows: SeatAdminRow[] = await this.txHost.tx.query(ACTIVE_SEAT_BY_LABEL, [
      label,
      excludeId ?? null,
    ]);
    const row = rows[0];
    if (!row) return null;
    return this.toAdminSeat(row);
  }

  public async getMaxSortOrder(kind: TableSeatKind): Promise<number> {
    const row = this.firstRow(await this.txHost.tx.query(MAX_SORT_ORDER, [kind]));
    return row?.max_sort_order != null ? Number(row.max_sort_order) : -1;
  }

  public async listByKind(kind: TableSeatKind): Promise<SeatAdminRecord[]> {
    const rows: SeatAdminRow[] = await this.txHost.tx.query(ADMIN_SEATS_BY_KIND, [kind]);
    return rows.map((row) => this.toAdminSeat(row));
  }

  public async create(input: CreateSeatRecordInput): Promise<SeatAdminRecord> {
    try {
      const seat = this.repo.create({
        label: input.label,
        kind: input.kind,
        sortOrder: input.sortOrder,
        qrToken: input.qrToken,
        isActive: true,
      });
      const saved = await this.repo.save(seat);
      return {
        id: saved.id,
        label: saved.label,
        kind: saved.kind,
        sortOrder: Number(saved.sortOrder),
        isActive: saved.isActive,
        qrToken: input.qrToken,
        hasLiveVisit: false,
      };
    } catch (error) {
      if (this.isSeatLabelConflict(error)) {
        throw new DuplicateSeatLabelError();
      }
      throw error;
    }
  }

  public async update(id: string, input: UpdateSeatRecordInput): Promise<SeatAdminRecord | null> {
    try {
      const seat = await this.repo.findOne({ where: { id } });
      if (!seat) return null;
      if (input.label !== undefined) seat.label = input.label;
      if (input.kind !== undefined) seat.kind = input.kind;
      if (input.sortOrder !== undefined) seat.sortOrder = input.sortOrder;
      if (input.isActive !== undefined) seat.isActive = input.isActive;
      await this.repo.save(seat);
      return await this.findAdminById(id);
    } catch (error) {
      if (this.isSeatLabelConflict(error)) {
        throw new DuplicateSeatLabelError();
      }
      throw error;
    }
  }

  public async updateSortOrders(orders: SeatSortOrderItem[]): Promise<void> {
    if (orders.length === 0) return;
    const ids = orders.map((o) => o.id);
    const seats = await this.repo.find({ where: { id: In(ids) } });
    if (seats.length !== orders.length) {
      throw new Error(`Expected ${orders.length} seats to reorder, found ${seats.length}`);
    }
    const orderMap = new Map(orders.map((o) => [o.id, o.sortOrder]));
    for (const seat of seats) {
      const newOrder = orderMap.get(seat.id);
      if (newOrder !== undefined) {
        seat.sortOrder = newOrder;
      }
    }
    await this.repo.save(seats);
  }

  public async lockForUpdate(id: string): Promise<boolean> {
    const result: unknown = await this.txHost.tx.query(
      'SELECT id FROM table_seat WHERE id = $1 FOR UPDATE',
      [id],
    );
    return this.listed(result).length > 0;
  }

  private isSeatLabelConflict(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) return false;
    const driver = error.driverError as { code?: string; constraint?: string };
    if (driver.code !== '23505') return false;
    return (
      driver.constraint === SEAT_LABEL_INDEX ||
      error.message.includes(SEAT_LABEL_INDEX)
    );
  }

  private get repo(): Repository<TableSeat> {
    return this.txHost.tx.getRepository(TableSeat);
  }

  private toAdminSeat(row: SeatAdminRow): SeatAdminRecord {
    return {
      id: row.id,
      label: row.label,
      kind: row.kind,
      sortOrder: Number(row.sort_order),
      isActive: Boolean(row.is_active),
      qrToken: row.qr_token ? readText(row.qr_token) : null,
      hasLiveVisit: Boolean(row.has_live_visit),
    };
  }

  private listed(result: unknown): unknown[] {
    if (!Array.isArray(result)) return [];
    if (Array.isArray(result[0])) return result[0] as unknown[];
    return result;
  }

  private firstRow(result: unknown): Record<string, unknown> | null {
    const rows = this.listed(result);
    const row = rows[0];
    if (!row || typeof row !== 'object' || Array.isArray(row)) return null;
    return row as Record<string, unknown>;
  }
}
