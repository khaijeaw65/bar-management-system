import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import type { VisitOpenSource, VisitState } from '@bar/contracts';
import { In, type Repository } from 'typeorm';
import type { VisitRepository } from '../../domain/visit.repository.js';
import type {
  InsertVisitResult,
  NewVisit,
  VisitRecord,
} from '../../domain/visit.types.js';
import {
  readDate,
  readOptionalDate,
  readOptionalText,
  readText,
} from '../../../../common/persistence/row-values.js';
import { Visit } from './visit.entity.js';

const LIVE_STATES = ['open', 'active', 'idle'] as const;

const CLOSE_IF_LIVE = `
  UPDATE visit
  SET state = 'closed', closed_at = now()
  WHERE id = $1 AND state IN ('open', 'active', 'idle')
  RETURNING id, table_seat_id, state, opened_at, closed_at,
            guest_label, opened_by, opened_via
`;

const LOCK_VISIT = `
  SELECT id, table_seat_id, state, opened_at, closed_at, guest_label, opened_by, opened_via
  FROM visit WHERE id = $1 FOR UPDATE
`;

const ACTIVATE_VISIT = `
  UPDATE visit SET state = 'active'
  WHERE id = $1 AND state IN ('open', 'idle')
  RETURNING id, table_seat_id, state, opened_at, closed_at, guest_label, opened_by, opened_via
`;

const INSERT_STAFF_VISIT = `
  INSERT INTO visit (table_seat_id, state, guest_label, opened_by, opened_via, opened_at)
  VALUES ($1, 'open', $2, $3, $4, now())
  ON CONFLICT (table_seat_id) WHERE state IN ('open', 'active', 'idle') DO NOTHING
  RETURNING id, table_seat_id, state, opened_at, closed_at, guest_label, opened_by, opened_via
`;

const OPEN_FOR_GUEST = `
  INSERT INTO visit (table_seat_id, state, opened_via)
  SELECT $1, 'open', 'qr'
  WHERE EXISTS (
    SELECT 1 FROM table_seat
    WHERE id = $1 AND is_active = true
    FOR SHARE
  )
  ON CONFLICT (table_seat_id) WHERE state IN ('open', 'active', 'idle') DO NOTHING
  RETURNING id
`;

const LIVE_BY_SEAT = `
  SELECT v.id FROM visit v
  INNER JOIN table_seat s ON s.id = v.table_seat_id AND s.is_active = true
  WHERE v.table_seat_id = $1 AND v.state IN ('open', 'active', 'idle')
`;

@Injectable()
export class VisitTypeormRepository implements VisitRepository {
  public constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {}

  public async insert(input: NewVisit): Promise<InsertVisitResult> {
    const result: unknown = await this.txHost.tx.query(INSERT_STAFF_VISIT, [
      input.tableSeatId,
      input.guestLabel,
      input.staffId,
      input.via,
    ]);
    const row = this.firstRow(result);
    if (!row) return { kind: 'taken' };
    return { kind: 'created', visit: this.toAnyRecord(row) };
  }

  public async findById(id: string): Promise<VisitRecord | null> {
    const visit = await this.repo.findOne({ where: { id } });
    return visit ? this.toRecord(visit) : null;
  }

  public async findLiveBySeat(tableSeatId: string): Promise<VisitRecord | null> {
    const visit = await this.repo.findOne({
      where: { tableSeatId, state: In([...LIVE_STATES]) },
    });
    return visit ? this.toRecord(visit) : null;
  }

  public async lockById(id: string): Promise<VisitRecord | null> {
    const result: unknown = await this.txHost.tx.query(LOCK_VISIT, [id]);
    const row = this.firstRow(result);
    return row ? this.toAnyRecord(row) : null;
  }

  public async activateIfWaiting(id: string): Promise<VisitRecord | null> {
    const result: unknown = await this.txHost.tx.query(ACTIVATE_VISIT, [id]);
    const row = this.firstRow(result);
    return row ? this.toAnyRecord(row) : null;
  }

  public async openForGuest(tableSeatId: string): Promise<{ id: string; created: boolean } | null> {
    const inserted = this.firstRow(await this.txHost.tx.query(OPEN_FOR_GUEST, [tableSeatId]));
    if (inserted) return { id: readText(inserted.id), created: true };
    const live = this.firstRow(await this.txHost.tx.query(LIVE_BY_SEAT, [tableSeatId]));
    return live ? { id: readText(live.id), created: false } : null;
  }

  public async closeIfLive(id: string): Promise<VisitRecord | null> {
    const result: unknown = await this.txHost.tx.query(CLOSE_IF_LIVE, [id]);
    const row = this.firstUpdatedRow(result);
    return row ? this.toClosedRecord(row) : null;
  }

  private get repo(): Repository<Visit> {
    return this.txHost.tx.getRepository(Visit);
  }

  private toRecord(visit: Visit): VisitRecord {
    return {
      id: visit.id,
      tableSeatId: visit.tableSeatId,
      state: visit.state,
      openedAt: visit.openedAt,
      closedAt: visit.closedAt,
      guestLabel: visit.guestLabel,
      openedBy: visit.openedBy,
      openedVia: visit.openedVia,
    };
  }

  private firstRow(result: unknown): Record<string, unknown> | null {
    const rows = this.listed(result);
    const row = rows[0];
    if (!row || typeof row !== 'object' || Array.isArray(row)) return null;
    return row as Record<string, unknown>;
  }

  private listed(result: unknown): unknown[] {
    if (!Array.isArray(result)) return [];
    if (Array.isArray(result[0])) return result[0] as unknown[];
    return result;
  }

  private toAnyRecord(row: Record<string, unknown>): VisitRecord {
    return {
      id: readText(row.id),
      tableSeatId: readText(row.table_seat_id),
      state: this.visitState(row.state),
      openedAt: readDate(row.opened_at),
      closedAt: readOptionalDate(row.closed_at),
      guestLabel: readOptionalText(row.guest_label),
      openedBy: readOptionalText(row.opened_by),
      openedVia: this.openSource(row.opened_via),
    };
  }

  private visitState(value: unknown): VisitState {
    if (this.isVisitState(value)) return value;
    throw new Error('visit row has an unknown state');
  }

  private isVisitState(value: unknown): value is VisitState {
    return value === 'open' || value === 'active' || value === 'idle' || value === 'closed' || value === 'abandoned';
  }

  private openSource(value: unknown): VisitOpenSource {
    if (value === 'pos' || value === 'app' || value === 'qr') return value;
    throw new Error('visit row has an unknown opened_via');
  }

  private firstUpdatedRow(result: unknown): Record<string, unknown> | null {
    if (!Array.isArray(result) || !Array.isArray(result[0])) return null;
    const row: unknown = result[0][0];
    if (!row || typeof row !== 'object') return null;
    return row as Record<string, unknown>;
  }

  private toClosedRecord(row: Record<string, unknown>): VisitRecord {
    return {
      id: readText(row.id),
      tableSeatId: readText(row.table_seat_id),
      state: 'closed',
      openedAt: readDate(row.opened_at),
      closedAt: readDate(row.closed_at),
      guestLabel: readOptionalText(row.guest_label),
      openedBy: readOptionalText(row.opened_by),
      openedVia: this.openSource(row.opened_via),
    };
  }
}
