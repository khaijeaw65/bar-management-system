import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { TableSeatRepository } from '../../domain/table-seat.repository.js';
import type {
  SeatIdentity,
  SeatWithLiveVisit,
  StaffCallRecord,
} from '../../domain/table-seat.types.js';
import { readDate } from '../../../../common/persistence/row-values.js';
import { TableSeat } from './table-seat.entity.js';
import type { SeatVisitRow } from './table-seat.types.js';

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

@Injectable()
export class TableSeatTypeormRepository implements TableSeatRepository {
  public constructor(
    @InjectRepository(TableSeat)
    private readonly tableSeatOrmRepository: Repository<TableSeat>,
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

  public async clearStaffCall(id: string): Promise<boolean> {
    const seat = await this.tableSeatOrmRepository.findOne({ where: { id } });
    if (!seat?.staffCalledAt) return false;
    seat.staffCalledAt = null;
    seat.staffCallReason = null;
    seat.staffCallNote = null;
    await this.tableSeatOrmRepository.save(seat);
    return true;
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

  private toIdentity(seat: TableSeat): SeatIdentity {
    return {
      id: seat.id,
      label: seat.label,
      kind: seat.kind,
      sortOrder: seat.sortOrder,
    };
  }
}
