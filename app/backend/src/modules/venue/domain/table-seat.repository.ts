import type { CallStaffReason } from '@bar/contracts';
import type {
  SeatIdentity,
  SeatWithLiveVisit,
  StaffCallRecord,
} from './table-seat.types.js';

export abstract class TableSeatRepository {
  public abstract listActive(): Promise<SeatWithLiveVisit[]>;
  public abstract findById(id: string): Promise<SeatIdentity | null>;
  public abstract findActiveById(id: string): Promise<SeatIdentity | null>;
  public abstract findActiveByQrToken(qrToken: string): Promise<SeatIdentity | null>;
  public abstract replaceQrToken(id: string, qrToken: string): Promise<void>;
  /** Sets (or overwrites) the bell. */
  public abstract setStaffCall(id: string, call: StaffCallRecord): Promise<void>;
  /** Clears a ringing bell and returns what it was. A second clear in flight gets null. */
  public abstract clearStaffCall(id: string, onlyReason?: CallStaffReason): Promise<StaffCallRecord | null>;
  public abstract lockActiveForShare(id: string): Promise<SeatIdentity | null>;
}
