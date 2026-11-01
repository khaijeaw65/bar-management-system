import type { CallStaffReason, TableSeatKind } from '@bar/contracts';
import type {
  CreateSeatRecordInput,
  SeatAdminRecord,
  SeatIdentity,
  SeatWithLiveVisit,
  StaffCallRecord,
  UpdateSeatRecordInput,
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

  public abstract listAdmin(): Promise<SeatAdminRecord[]>;
  public abstract findAdminById(id: string): Promise<SeatAdminRecord | null>;
  public abstract findActiveByLabel(label: string, excludeId?: string): Promise<SeatAdminRecord | null>;
  public abstract getMaxSortOrder(kind: TableSeatKind): Promise<number>;
  public abstract listByKind(kind: TableSeatKind): Promise<SeatAdminRecord[]>;
  public abstract create(input: CreateSeatRecordInput): Promise<SeatAdminRecord>;
  public abstract update(id: string, input: UpdateSeatRecordInput): Promise<SeatAdminRecord | null>;
  public abstract updateSortOrders(orders: Array<{ id: string; sortOrder: number }>): Promise<void>;
}
