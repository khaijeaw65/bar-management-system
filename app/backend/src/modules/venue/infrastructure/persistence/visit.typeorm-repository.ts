import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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

@Injectable()
export class VisitTypeormRepository implements VisitRepository {
  public constructor(
    @InjectRepository(Visit)
    private readonly visits: Repository<Visit>,
  ) {}

  public async insert(input: NewVisit): Promise<InsertVisitResult> {
    try {
      const saved = await this.visits.save(this.visits.create(newRow(input)));
      return { kind: 'created', visit: toRecord(saved) };
    } catch (error) {
      if (!isLiveVisitConflict(error)) throw error;
      return { kind: 'taken' };
    }
  }

  public async findById(id: string): Promise<VisitRecord | null> {
    const visit = await this.visits.findOne({ where: { id } });
    return visit ? toRecord(visit) : null;
  }

  public async findLiveBySeat(tableSeatId: string): Promise<VisitRecord | null> {
    const visit = await this.visits.findOne({
      where: { tableSeatId, state: In([...LIVE_STATES]) },
    });
    return visit ? toRecord(visit) : null;
  }

  public async saveClosed(id: string, closedAt: Date): Promise<VisitRecord> {
    const visit = await this.requireVisit(id);
    visit.state = 'closed';
    visit.closedAt = closedAt;
    return toRecord(await this.visits.save(visit));
  }

  private async requireVisit(id: string): Promise<Visit> {
    const visit = await this.visits.findOne({ where: { id } });
    if (!visit) throw new Error(`visit ${id} disappeared before close`);
    return visit;
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

function isLiveVisitConflict(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) return false;
  const driver = error.driverError as { code?: string; constraint?: string };
  if (driver.code !== '23505') return false;
  return (
    driver.constraint === LIVE_VISIT_INDEX ||
    error.message.includes(LIVE_VISIT_INDEX)
  );
}
