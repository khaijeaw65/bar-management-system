import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { VisitOpenSource } from '@bar/contracts';
import { In, QueryFailedError, Repository } from 'typeorm';
import type { VisitRepository } from '../../domain/visit.repository.js';
import type {
  InsertVisitResult,
  NewVisit,
  VisitRecord,
} from '../../domain/visit.types.js';
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

@Injectable()
export class VisitTypeormRepository implements VisitRepository {
  public constructor(
    @InjectRepository(Visit)
    private readonly visitOrmRepository: Repository<Visit>,
  ) {}

  public async insert(input: NewVisit): Promise<InsertVisitResult> {
    try {
      const saved = await this.visitOrmRepository.save(this.visitOrmRepository.create(newRow(input)));
      return { kind: 'created', visit: toRecord(saved) };
    } catch (error) {
      if (!isLiveVisitConflict(error)) throw error;
      return { kind: 'taken' };
    }
  }

  public async findById(id: string): Promise<VisitRecord | null> {
    const visit = await this.visitOrmRepository.findOne({ where: { id } });
    return visit ? toRecord(visit) : null;
  }

  public async findLiveBySeat(tableSeatId: string): Promise<VisitRecord | null> {
    const visit = await this.visitOrmRepository.findOne({
      where: { tableSeatId, state: In([...LIVE_STATES]) },
    });
    return visit ? toRecord(visit) : null;
  }

  public async closeIfLive(id: string): Promise<VisitRecord | null> {
    const result: unknown = await this.visitOrmRepository.query(CLOSE_IF_LIVE, [
      id,
    ]);
    const row = firstUpdatedRow(result);
    return row ? toClosedRecord(row) : null;
  }
}

function newRow(input: NewVisit): Partial<Visit> {
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

function toRecord(visit: Visit): VisitRecord {
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

function firstUpdatedRow(result: unknown): Record<string, unknown> | null {
  if (!Array.isArray(result) || !Array.isArray(result[0])) return null;
  const row: unknown = result[0][0];
  if (!row || typeof row !== 'object') return null;
  return row as Record<string, unknown>;
}

function toClosedRecord(row: Record<string, unknown>): VisitRecord {
  return {
    id: text(row.id),
    tableSeatId: text(row.table_seat_id),
    state: 'closed',
    openedAt: asDate(row.opened_at),
    closedAt: asDate(row.closed_at),
    guestLabel: optionalText(row.guest_label),
    openedBy: optionalText(row.opened_by),
    openedVia: openSource(row.opened_via),
  };
}

function text(value: unknown): string {
  if (typeof value !== 'string') throw new Error('visit row is missing a string');
  return value;
}

function optionalText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return text(value);
}

function asDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  throw new Error('visit row is missing a timestamp');
}

function openSource(value: unknown): VisitOpenSource {
  if (value === 'pos' || value === 'app' || value === 'qr') return value;
  throw new Error('visit row has an unknown opened_via');
}

function isLiveVisitConflict(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) return false;
  const driver = error.driverError as { code?: string; constraint?: string };
  if (driver.code !== '23505') return false;
  return (
    driver.constraint === LIVE_VISIT_INDEX ||
    error.message.includes(LIVE_VISIT_INDEX)
  );
}
