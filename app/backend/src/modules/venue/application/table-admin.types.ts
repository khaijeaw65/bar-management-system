import type { CreateSeatRequest, ReorderSeatsRequest, UpdateSeatRequest } from '@bar/contracts';
import type { SeatAdminRecord, SeatSortOrderItem } from '../domain/table-seat.types.js';

export type CreateSeatInput = CreateSeatRequest;
export type UpdateSeatInput = UpdateSeatRequest;
export type ReorderSeatsInput = ReorderSeatsRequest;

export interface DeactivationOutcome {
  seat: SeatAdminRecord;
  bellCleared: boolean;
}

export type ReorderItem = SeatSortOrderItem;
