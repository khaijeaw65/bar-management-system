import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { TableSeatKind, VisitState } from '@bar/contracts';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { Repository } from 'typeorm';
import { readDate, readOptionalText, readText } from '../../../../common/persistence/row-values.js';
import type { GuestSessionRepository } from '../../domain/guest-session.repository.js';
import type { GuestSessionRow, NewGuestSession } from '../../domain/guest-session.types.js';
import { GuestSession } from './guest-session.entity.js';

const FIND_BY_HASH = `
  SELECT g.id, g.visit_id, g.display_name, g.expires_at,
         s.id AS seat_id, s.label, s.kind, s.is_active, v.state AS visit_state
  FROM guest_session g
  JOIN table_seat s ON s.id = g.table_seat_id
  LEFT JOIN visit v ON v.id = g.visit_id
  WHERE g.token_hash = $1
`;

const BIND_VISIT = `UPDATE guest_session SET visit_id = $2 WHERE id = $1 AND visit_id IS NULL`;

const PURGE_EXPIRED = `
  DELETE FROM guest_session
  WHERE id IN (
    SELECT id FROM guest_session WHERE visit_id IS NULL AND expires_at < $1 LIMIT $2
  )
  RETURNING id
`;

interface SessionJoinRow {
  id: unknown;
  visit_id: unknown;
  display_name: unknown;
  expires_at: unknown;
  seat_id: unknown;
  label: unknown;
  kind: TableSeatKind;
  is_active: boolean;
  visit_state: VisitState | null;
}

@Injectable()
export class GuestSessionTypeormRepository implements GuestSessionRepository {
  public constructor(
    @InjectRepository(GuestSession)
    private readonly ormRepository: Repository<GuestSession>,
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {}

  public async insert(input: NewGuestSession): Promise<string> {
    const saved = await this.ormRepository.save(this.ormRepository.create(input));
    return saved.id;
  }

  public async findByTokenHash(tokenHash: string): Promise<GuestSessionRow | null> {
    const rows: SessionJoinRow[] = await this.ormRepository.query(FIND_BY_HASH, [tokenHash]);
    const row = rows[0];
    return row ? this.toRow(row) : null;
  }

  public async setExpiresAt(id: string, expiresAt: Date): Promise<void> {
    await this.mutate(id, (session) => {
      session.expiresAt = expiresAt;
    });
  }

  // Through the transaction handle: the visit row it points at is not committed yet.
  public async bindVisit(id: string, visitId: string): Promise<void> {
    await this.txHost.tx.query(BIND_VISIT, [id, visitId]);
  }

  public async setDisplayName(id: string, displayName: string | null): Promise<void> {
    await this.mutate(id, (session) => {
      session.displayName = displayName;
    });
  }

  public async purgeExpired(before: Date, limit: number): Promise<number> {
    const rows: unknown[] = await this.ormRepository.query(PURGE_EXPIRED, [before, limit]);
    return rows.length;
  }

  // save(), not update(): the row goes through the entity like every other table (CLAUDE.md).
  private async mutate(id: string, change: (session: GuestSession) => void): Promise<void> {
    const session = await this.ormRepository.findOne({ where: { id } });
    if (!session) return;
    change(session);
    await this.ormRepository.save(session);
  }

  private toRow(row: SessionJoinRow): GuestSessionRow {
    return {
      id: readText(row.id),
      seat: {
        id: readText(row.seat_id),
        label: readText(row.label),
        kind: row.kind,
        isActive: row.is_active,
      },
      visitId: readOptionalText(row.visit_id),
      visitState: row.visit_state,
      displayName: readOptionalText(row.display_name),
      expiresAt: readDate(row.expires_at),
    };
  }
}
