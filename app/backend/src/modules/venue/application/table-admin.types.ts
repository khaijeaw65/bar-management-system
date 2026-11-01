import type { CreateSeatRequest, ReorderSeatsRequest, UpdateSeatRequest } from '@bar/contracts';
import type { SeatAdminRecord } from '../domain/table-seat.types.js';

export type CreateSeatInput = CreateSeatRequest;
export type UpdateSeatInput = UpdateSeatRequest;
export type ReorderSeatsInput = ReorderSeatsRequest;

export interface DeactivationOutcome {
  seat: SeatAdminRecord;
  bellCleared: boolean;
}

export interface ReorderItem {
  id: string;
  sortOrder: number;
}
