import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import type { VisitOpenSource, VisitState } from '@bar/contracts';
import { In, QueryFailedError, Repository } from 'typeorm';
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
const LIVE_VISIT_INDEX = 'uq_visit_live_per_seat';
const CLOSE_IF_LIVE = `
  UPDATE visit
  SET state = 'closed', closed_at = now(), updated_at = now()
  WHERE id = $1 AND state IN ('open', 'active', 'idle')
  RETURNING id, table_seat_id, state, opened_at, closed_at,
            guest_label, opened_by, opened_via
`;

const LOCK_VISIT = `
  SELECT id, table_seat_id, state, opened_at, closed_at, guest_label, opened_by, opened_via
  FROM visit WHERE id = $1 FOR UPDATE
`;
const ACTIVATE_VISIT = `
  UPDATE visit SET state = 'active', updated_at = now()
  WHERE id = $1 AND state IN ('open', 'idle')
  RETURNING id, table_seat_id, state, opened_at, closed_at, guest_label, opened_by, opened_via
`;

@Injectable()
export class VisitTypeormRepository implements VisitRepository {
  public constructor(
    @InjectRepository(Visit)
    private readonly visitOrmRepository: Repository<Visit>,
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {}

  public async insert(input: NewVisit): Promise<InsertVisitResult> {
    try {
      const saved = await this.visitOrmRepository.save(
        this.visitOrmRepository.create(this.newRow(input)),
      );
      return { kind: 'created', visit: this.toRecord(saved) };
    } catch (error) {
      if (!this.isLiveVisitConflict(error)) throw error;
      return { kind: 'taken' };
    }
  }

  public async findById(id: string): Promise<VisitRecord | null> {
    const visit = await this.visitOrmRepository.findOne({ where: { id } });
    return visit ? this.toRecord(visit) : null;
  }

  public async findLiveBySeat(tableSeatId: string): Promise<VisitRecord | null> {
    const visit = await this.visitOrmRepository.findOne({
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

  public async closeIfLive(id: string): Promise<VisitRecord | null> {
    const result: unknown = await this.txHost.tx.query(CLOSE_IF_LIVE, [id]);
    const row = this.firstUpdatedRow(result);
    return row ? this.toClosedRecord(row) : null;
  }

  private newRow(input: NewVisit): Partial<Visit> {
    return {
      tableSeatId: input.tableSeatId,
      state: 'open',
      guestLabel: input.guestLabel,
      openedBy: input.staffId,
      openedVia: input.via,
      openedAt: new Date(),
      closedAt: null,
      customerId: null,
    };
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

  private isLiveVisitConflict(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) return false;
    const driver = error.driverError as { code?: string; constraint?: string };
    if (driver.code !== '23505') return false;
    return (
      driver.constraint === LIVE_VISIT_INDEX ||
      error.message.includes(LIVE_VISIT_INDEX)
    );
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
