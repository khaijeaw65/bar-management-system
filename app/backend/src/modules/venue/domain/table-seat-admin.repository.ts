import type { TableSeatKind } from '@bar/contracts';
import type {
  CreateSeatRecordInput,
  SeatAdminRecord,
  SeatSortOrderItem,
  UpdateSeatRecordInput,
} from './table-seat.types.js';

export abstract class ITableSeatAdminRepository {
  public abstract listAdmin(): Promise<SeatAdminRecord[]>;
  public abstract findAdminById(id: string): Promise<SeatAdminRecord | null>;
  public abstract findActiveByLabel(label: string, excludeId?: string): Promise<SeatAdminRecord | null>;
  public abstract getMaxSortOrder(kind: TableSeatKind): Promise<number>;
  public abstract listByKind(kind: TableSeatKind): Promise<SeatAdminRecord[]>;
  public abstract create(input: CreateSeatRecordInput): Promise<SeatAdminRecord>;
  public abstract update(id: string, input: UpdateSeatRecordInput): Promise<SeatAdminRecord | null>;
  public abstract updateSortOrders(orders: SeatSortOrderItem[]): Promise<void>;
  public abstract lockForUpdate(id: string): Promise<boolean>;
}
