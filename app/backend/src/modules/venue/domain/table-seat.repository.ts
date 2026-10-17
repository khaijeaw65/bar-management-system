import type { SeatIdentity, SeatWithLiveVisit } from './table-seat.types.js';

export interface TableSeatRepository {
  listActive(): Promise<SeatWithLiveVisit[]>;
  findById(id: string): Promise<SeatIdentity | null>;
  findActiveById(id: string): Promise<SeatIdentity | null>;
  replaceQrToken(id: string, qrToken: string): Promise<void>;
}

export const TABLE_SEAT_REPOSITORY = Symbol('TABLE_SEAT_REPOSITORY');
