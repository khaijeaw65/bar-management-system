import type { SeatIdentity, SeatWithLiveVisit, StaffCallRecord } from './table-seat.types.js';

export interface TableSeatRepository {
  listActive(): Promise<SeatWithLiveVisit[]>;
  findById(id: string): Promise<SeatIdentity | null>;
  findActiveById(id: string): Promise<SeatIdentity | null>;
  findActiveByQrToken(qrToken: string): Promise<SeatIdentity | null>;
  replaceQrToken(id: string, qrToken: string): Promise<void>;
  /** Sets (or overwrites) the bell. */
  setStaffCall(id: string, call: StaffCallRecord): Promise<void>;
  /** Clears the bell; true when there was one. */
  clearStaffCall(id: string): Promise<boolean>;
}

export const TABLE_SEAT_REPOSITORY = Symbol('TABLE_SEAT_REPOSITORY');
