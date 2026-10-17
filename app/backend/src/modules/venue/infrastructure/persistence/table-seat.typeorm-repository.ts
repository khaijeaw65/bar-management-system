import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { TableSeatRepository } from '../../domain/table-seat.repository.js';
import type {
  SeatIdentity,
  SeatWithLiveVisit,
} from '../../domain/table-seat.types.js';
import { TableSeat } from './table-seat.entity.js';
import type { SeatVisitRow } from './table-seat.types.js';

const ACTIVE_SEATS = `
  SELECT s.id, s.label, s.kind, s.sort_order,
         v.id AS visit_id, v.state, v.opened_at, v.guest_label
  FROM table_seat s
  LEFT JOIN visit v
    ON v.table_seat_id = s.id
   AND v.state IN ('open', 'active', 'idle')
  WHERE s.is_active = true
  ORDER BY CASE s.kind WHEN 'counter' THEN 0 ELSE 1 END, s.sort_order, s.label
`;

@Injectable()
export class TableSeatTypeormRepository implements TableSeatRepository {
  public constructor(
    @InjectRepository(TableSeat)
    private readonly seats: Repository<TableSeat>,
  ) {}

  public async listActive(): Promise<SeatWithLiveVisit[]> {
    const rows: SeatVisitRow[] = await this.seats.query(ACTIVE_SEATS);
    return rows.map(toSeat);
  }

  public async findById(id: string): Promise<SeatIdentity | null> {
    const seat = await this.seats.findOne({ where: { id } });
    return seat ? toIdentity(seat) : null;
  }

  public async findActiveById(id: string): Promise<SeatIdentity | null> {
    const seat = await this.seats.findOne({ where: { id, isActive: true } });
    return seat ? toIdentity(seat) : null;
  }

  public async replaceQrToken(id: string, qrToken: string): Promise<void> {
    const seat = await this.seats.findOne({ where: { id } });
    if (!seat) return;
    seat.qrToken = qrToken;
    await this.seats.save(seat);
  }
}

function toIdentity(seat: TableSeat): SeatIdentity {
  return {
    id: seat.id,
    label: seat.label,
    kind: seat.kind,
    sortOrder: seat.sortOrder,
  };
}

function toSeat(row: SeatVisitRow): SeatWithLiveVisit {
  return {
    id: row.id,
    label: row.label,
    kind: row.kind,
    sortOrder: Number(row.sort_order),
    currentVisit: row.visit_id ? toCard(row) : null,
  };
}

function toCard(row: SeatVisitRow): SeatWithLiveVisit['currentVisit'] {
  if (!row.visit_id || !row.state || !row.opened_at) return null;
  return {
    id: row.visit_id,
    state: row.state,
    openedAt: asDate(row.opened_at),
    guestLabel: row.guest_label,
  };
}

function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}
