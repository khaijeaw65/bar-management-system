import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import type { CallStaffReason, TableSeatKind } from '@bar/contracts';
import { InjectRepository } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import { Repository } from 'typeorm';
import type { TableSeatRepository } from '../../domain/table-seat.repository.js';
import type {
  CreateSeatRecordInput,
  SeatAdminRecord,
  SeatIdentity,
  SeatWithLiveVisit,
  StaffCallRecord,
  UpdateSeatRecordInput,
} from '../../domain/table-seat.types.js';
import { readDate, readOptionalText } from '../../../../common/persistence/row-values.js';
import { TableSeat } from './table-seat.entity.js';
import type { SeatAdminRow, SeatVisitRow } from './table-seat.types.js';

// Lock the ringing row, clear it, and hand back the bell that was there.
// A second clear waits on the lock, sees no bell, and changes nothing.
const CLEAR_STAFF_CALL = `
  WITH previous AS (
    SELECT id, staff_called_at, staff_call_reason, staff_call_note
    FROM table_seat
    WHERE id = $1
      AND staff_called_at IS NOT NULL
      AND ($2::text IS NULL OR staff_call_reason = $2)
    FOR UPDATE
  )
  UPDATE table_seat AS seat
  SET staff_called_at = NULL,
      staff_call_reason = NULL,
      staff_call_note = NULL,
      updated_by = COALESCE($3::uuid, seat.updated_by)
  FROM previous
  WHERE seat.id = previous.id
  RETURNING previous.staff_called_at, previous.staff_call_reason, previous.staff_call_note
`;

const ACTIVE_SEATS = `
  SELECT s.id, s.label, s.kind, s.sort_order,
         v.id AS visit_id, v.state, v.opened_at, v.guest_label,
         s.staff_called_at, s.staff_call_reason, s.staff_call_note
  FROM table_seat s
  LEFT JOIN visit v
    ON v.table_seat_id = s.id
   AND v.state IN ('open', 'active', 'idle')
  WHERE s.is_active = true
  ORDER BY CASE s.kind WHEN 'counter' THEN 0 ELSE 1 END, s.sort_order, s.label
`;

const ADMIN_SELECT = `
  SELECT s.id, s.label, s.kind, s.sort_order, s.is_active, s.qr_token,
         CASE WHEN v.id IS NOT NULL THEN true ELSE false END AS has_live_visit
  FROM table_seat s
  LEFT JOIN visit v
    ON v.table_seat_id = s.id
   AND v.state IN ('open', 'active', 'idle')
`;

const ADMIN_SEATS = `${ADMIN_SELECT} ORDER BY CASE s.kind WHEN 'counter' THEN 0 ELSE 1 END, s.sort_order, s.label`;
const ADMIN_SEAT_BY_ID = `${ADMIN_SELECT} WHERE s.id = $1`;
const ACTIVE_SEAT_BY_LABEL = `${ADMIN_SELECT} WHERE s.is_active = true AND lower(trim(s.label)) = lower(trim($1)) AND ($2::uuid IS NULL OR s.id != $2)`;
const ADMIN_SEATS_BY_KIND = `${ADMIN_SELECT} WHERE s.kind = $1::table_seat_kind ORDER BY s.sort_order, s.label`;

const MAX_SORT_ORDER = `
  SELECT COALESCE(MAX(sort_order), -1) AS max_sort_order
  FROM table_seat
  WHERE kind = $1::table_seat_kind
`;

@Injectable()
export class TableSeatTypeormRepository implements TableSeatRepository {
  public constructor(
    @InjectRepository(TableSeat)
    private readonly tableSeatOrmRepository: Repository<TableSeat>,
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
    private readonly cls: ClsService,
  ) {}

  public async listActive(): Promise<SeatWithLiveVisit[]> {
    const rows: SeatVisitRow[] = await this.tableSeatOrmRepository.query(ACTIVE_SEATS);
    return rows.map((row) => this.toSeat(row));
  }

  public async findById(id: string): Promise<SeatIdentity | null> {
    const seat = await this.tableSeatOrmRepository.findOne({ where: { id } });
    return seat ? this.toIdentity(seat) : null;
  }

  public async findActiveById(id: string): Promise<SeatIdentity | null> {
    const seat = await this.tableSeatOrmRepository.findOne({ where: { id, isActive: true } });
    return seat ? this.toIdentity(seat) : null;
  }

  public async findActiveByQrToken(qrToken: string): Promise<SeatIdentity | null> {
    const seat = await this.tableSeatOrmRepository.findOne({ where: { qrToken, isActive: true } });
    return seat ? this.toIdentity(seat) : null;
  }

  public async replaceQrToken(id: string, qrToken: string): Promise<void> {
    const seat = await this.tableSeatOrmRepository.findOne({ where: { id } });
    if (!seat) return;
    seat.qrToken = qrToken;
    await this.tableSeatOrmRepository.save(seat);
  }

  public async setStaffCall(id: string, call: StaffCallRecord): Promise<void> {
    const seat = await this.tableSeatOrmRepository.findOne({ where: { id } });
    if (!seat) return;
    seat.staffCalledAt = call.calledAt;
    seat.staffCallReason = call.reason;
    seat.staffCallNote = call.note;
    await this.tableSeatOrmRepository.save(seat);
  }

  public async clearStaffCall(id: string, onlyReason?: CallStaffReason): Promise<StaffCallRecord | null> {
    const result: unknown = await this.txHost.tx.query(CLEAR_STAFF_CALL, [
      id,
      onlyReason ?? null,
      this.actorId(),
    ]);
    const row = this.firstRow(result);
    if (!row) return null;
    return {
      reason: this.callReason(row.staff_call_reason),
      note: readOptionalText(row.staff_call_note),
      calledAt: readDate(row.staff_called_at),
    };
  }

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
    const result: unknown = await this.txHost.tx.query(MAX_SORT_ORDER, [kind]);
    const row = this.firstRow(result);
    if (!row || row.max_sort_order === undefined || row.max_sort_order === null) return -1;
    return Number(row.max_sort_order);
  }

  public async listByKind(kind: TableSeatKind): Promise<SeatAdminRecord[]> {
    const rows: SeatAdminRow[] = await this.txHost.tx.query(ADMIN_SEATS_BY_KIND, [kind]);
    return rows.map((row) => this.toAdminSeat(row));
  }

  public async create(input: CreateSeatRecordInput): Promise<SeatAdminRecord> {
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
      qrToken: saved.qrToken ?? input.qrToken,
      hasLiveVisit: false,
    };
  }

  public async update(id: string, input: UpdateSeatRecordInput): Promise<SeatAdminRecord | null> {
    const seat = await this.repo.findOne({ where: { id } });
    if (!seat) return null;
    if (input.label !== undefined) seat.label = input.label;
    if (input.kind !== undefined) seat.kind = input.kind;
    if (input.sortOrder !== undefined) seat.sortOrder = input.sortOrder;
    if (input.isActive !== undefined) seat.isActive = input.isActive;
    await this.repo.save(seat);
    return await this.findAdminById(id);
  }

  public async updateSortOrders(orders: Array<{ id: string; sortOrder: number }>): Promise<void> {
    for (const item of orders) {
      const seat = await this.repo.findOne({ where: { id: item.id } });
      if (seat) {
        seat.sortOrder = item.sortOrder;
        await this.repo.save(seat);
      }
    }
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
      qrToken: row.qr_token ?? '',
      hasLiveVisit: Boolean(
        row.has_live_visit === true ||
          row.has_live_visit === 'true' ||
          row.has_live_visit === 1,
      ),
    };
  }

  private toSeat(row: SeatVisitRow): SeatWithLiveVisit {
    return {
      id: row.id,
      label: row.label,
      kind: row.kind,
      sortOrder: Number(row.sort_order),
      currentVisit: row.visit_id ? this.toCard(row) : null,
      staffCall: this.toCall(row),
    };
  }

  private toCall(row: SeatVisitRow): StaffCallRecord | null {
    if (!row.staff_called_at) return null;
    return {
      reason: row.staff_call_reason,
      note: row.staff_call_note,
      calledAt: readDate(row.staff_called_at),
    };
  }

  private toCard(row: SeatVisitRow): SeatWithLiveVisit['currentVisit'] {
    if (!row.visit_id || !row.state || !row.opened_at) return null;
    return {
      id: row.visit_id,
      state: row.state,
      openedAt: readDate(row.opened_at),
      guestLabel: row.guest_label,
    };
  }

  private actorId(): string | null {
    const userId: unknown = this.cls.get('userId');
    if (typeof userId !== 'string' || userId.length === 0) return null;
    return userId;
  }

  private callReason(value: unknown): CallStaffReason | null {
    if (value === null) return null;
    if (value === 'bill' || value === 'other' || value === 'transfer') return value;
    throw new Error('table_seat row has an unknown staff_call_reason');
  }

  private firstRow(result: unknown): Record<string, unknown> | null {
    const rows = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;
    if (!Array.isArray(rows)) return null;
    const row: unknown = rows[0];
    if (!row || typeof row !== 'object' || Array.isArray(row)) return null;
    return row as Record<string, unknown>;
  }

  private toIdentity(seat: TableSeat): SeatIdentity {
    return {
      id: seat.id,
      label: seat.label,
      kind: seat.kind,
      sortOrder: seat.sortOrder,
    };
  }
}
