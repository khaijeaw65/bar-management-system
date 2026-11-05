import { Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import {
  TABLES_CHANGED,
  TABLE_STAFF_CALL_CLEARED,
  type SeatAdmin,
  type SeatAdminList,
  type TableSeatKind,
} from '@bar/contracts';
import { AuditLogService } from '../../../common/audit/audit-log.service.js';
import type { AuditFieldChange, AuditRecord } from '../../../common/audit/audit-log.types.js';
import { DomainException } from '../../../common/domain-exception.js';
import { NotificationsService } from '../../notifications/notifications.service.js';
import { ITableSeatAdminRepository } from '../domain/table-seat-admin.repository.js';
import { TableSeatRepository } from '../domain/table-seat.repository.js';
import { DuplicateSeatLabelError } from '../domain/table-seat.errors.js';
import type { SeatAdminRecord, UpdateSeatRecordInput } from '../domain/table-seat.types.js';
import { newQrToken } from './qr-token.js';
import type {
  CreateSeatInput,
  DeactivationOutcome,
  ReorderItem,
  ReorderSeatsInput,
  UpdateSeatInput,
} from './table-admin.types.js';

@Injectable()
export class TableAdminService {
  public constructor(
    private readonly tableSeatAdminRepository: ITableSeatAdminRepository,
    private readonly tableSeatRepository: TableSeatRepository,
    private readonly auditLog: AuditLogService,
    private readonly notifications: NotificationsService,
  ) {}

  public async listManage(): Promise<SeatAdminList> {
    const items = await this.tableSeatAdminRepository.listAdmin();
    return { items: items.map((item) => this.mapSeat(item)) };
  }

  public async create(input: CreateSeatInput): Promise<SeatAdmin> {
    await this.validateUniqueActiveLabel(input.label);
    const sortOrder = await this.calculateNextSortOrder(input.kind);
    const seat = await this.insertSeat(input, sortOrder);
    this.emitTablesChanged([seat.id]);
    return this.mapSeat(seat);
  }

  public async update(id: string, input: UpdateSeatInput): Promise<SeatAdmin> {
    const current = await this.requireSeat(id);
    await this.validateUpdateLabel(current, input.label);
    const sortOrder = await this.calculateUpdateSortOrder(current, input.kind);
    const updated = await this.persistUpdate(current, input, sortOrder);
    this.emitTablesChanged([updated.id]);
    return this.mapSeat(updated);
  }

  public async reorder(input: ReorderSeatsInput): Promise<SeatAdminList> {
    const sectionSeats = await this.tableSeatAdminRepository.listByKind(input.kind);
    this.validateReorderSection(sectionSeats, input.ids);
    await this.persistReorder(input.ids);
    this.emitTablesChanged(input.ids);
    return await this.listManage();
  }

  public async deactivate(id: string): Promise<SeatAdmin> {
    const outcome = await this.performDeactivation(id);
    this.notifyDeactivation(outcome);
    return this.mapSeat(outcome.seat);
  }

  public async activate(id: string): Promise<SeatAdmin> {
    const current = await this.requireSeat(id);
    await this.validateActivate(current);
    const updated = await this.performActivation(current);
    this.emitTablesChanged([updated.id]);
    return this.mapSeat(updated);
  }

  private async requireSeat(id: string): Promise<SeatAdminRecord> {
    const seat = await this.tableSeatAdminRepository.findAdminById(id);
    if (!seat) throw new DomainException('NOT_FOUND', 'ไม่พบโต๊ะ', 404);
    return seat;
  }

  private async validateUniqueActiveLabel(label: string, excludeId?: string): Promise<void> {
    const trimmed = label.trim();
    const existing = await this.tableSeatAdminRepository.findActiveByLabel(trimmed, excludeId);
    if (existing) throw new DomainException('SEAT_LABEL_TAKEN', 'มีชื่อนี้แล้ว', 409);
  }

  private async validateUpdateLabel(current: SeatAdminRecord, label?: string): Promise<void> {
    if (!label || !current.isActive) return;
    await this.validateUniqueActiveLabel(label, current.id);
  }

  private async calculateNextSortOrder(kind: TableSeatKind): Promise<number> {
    const max = await this.tableSeatAdminRepository.getMaxSortOrder(kind);
    return max + 1;
  }

  private async calculateUpdateSortOrder(
    current: SeatAdminRecord,
    newKind?: TableSeatKind,
  ): Promise<number | undefined> {
    if (!newKind || newKind === current.kind) return undefined;
    return await this.calculateNextSortOrder(newKind);
  }

  @Transactional()
  private async insertSeat(input: CreateSeatInput, sortOrder: number): Promise<SeatAdminRecord> {
    const qrToken = newQrToken();
    const created = await this.withDuplicateLabelGuard(() =>
      this.tableSeatAdminRepository.create({
        label: input.label.trim(),
        kind: input.kind,
        sortOrder,
        qrToken,
      }),
    );
    await this.auditLog.record(this.buildCreateAudit(created));
    return created;
  }

  @Transactional()
  private async persistUpdate(
    current: SeatAdminRecord,
    input: UpdateSeatInput,
    sortOrder?: number,
  ): Promise<SeatAdminRecord> {
    const patch = this.buildUpdatePatch(input, sortOrder);
    const updated = await this.withDuplicateLabelGuard(() =>
      this.tableSeatAdminRepository.update(current.id, patch),
    );
    if (!updated) throw new DomainException('NOT_FOUND', 'ไม่พบโต๊ะ', 404);
    await this.auditLog.record(this.buildUpdateAudit(current, updated));
    return updated;
  }

  private buildUpdatePatch(input: UpdateSeatInput, sortOrder?: number): UpdateSeatRecordInput {
    const patch: UpdateSeatRecordInput = {};
    if (input.label !== undefined) patch.label = input.label.trim();
    if (input.kind !== undefined) patch.kind = input.kind;
    if (sortOrder !== undefined) patch.sortOrder = sortOrder;
    return patch;
  }

  private validateReorderSection(sectionSeats: readonly SeatAdminRecord[], ids: readonly string[]): void {
    if (ids.length !== sectionSeats.length) {
      throw new DomainException('VALIDATION_ERROR', 'รายการโต๊ะไม่ถูกต้อง', 400);
    }
    const expected = new Set(sectionSeats.map((s) => s.id));
    const seen = new Set<string>();
    for (const id of ids) {
      if (!expected.has(id) || seen.has(id)) {
        throw new DomainException('VALIDATION_ERROR', 'รายการโต๊ะไม่ถูกต้อง', 400);
      }
      seen.add(id);
    }
  }

  @Transactional()
  private async persistReorder(ids: readonly string[]): Promise<void> {
    const orders: ReorderItem[] = ids.map((id, index) => ({ id, sortOrder: index }));
    await this.tableSeatAdminRepository.updateSortOrders(orders);
    const firstId = ids[0];
    if (firstId) {
      await this.auditLog.record(this.buildReorderAudit(firstId, ids));
    }
  }

  @Transactional()
  private async performDeactivation(id: string): Promise<DeactivationOutcome> {
    const locked = await this.tableSeatAdminRepository.lockForUpdate(id);
    if (!locked) throw new DomainException('NOT_FOUND', 'ไม่พบโต๊ะ', 404);
    const seat = await this.requireSeat(id);
    if (seat.hasLiveVisit) {
      throw new DomainException('SEAT_IN_USE', 'มีแขกอยู่ที่โต๊ะนี้ ปิดโต๊ะก่อน', 409);
    }
    if (!seat.isActive) return { seat, bellCleared: false };
    const bell = await this.tableSeatRepository.clearStaffCall(seat.id);
    const updated = await this.tableSeatAdminRepository.update(seat.id, { isActive: false });
    if (!updated) throw new DomainException('NOT_FOUND', 'ไม่พบโต๊ะ', 404);
    await this.auditLog.record(this.buildActiveAudit(seat.id, false));
    return { seat: updated, bellCleared: bell !== null };
  }

  private async validateActivate(current: SeatAdminRecord): Promise<void> {
    if (current.isActive) return;
    await this.validateUniqueActiveLabel(current.label, current.id);
  }

  @Transactional()
  private async performActivation(current: SeatAdminRecord): Promise<SeatAdminRecord> {
    if (current.isActive) return current;
    const updated = await this.withDuplicateLabelGuard(() =>
      this.tableSeatAdminRepository.update(current.id, { isActive: true }),
    );
    if (!updated) throw new DomainException('NOT_FOUND', 'ไม่พบโต๊ะ', 404);
    await this.auditLog.record(this.buildActiveAudit(current.id, true));
    return updated;
  }

  private async withDuplicateLabelGuard<T>(action: () => Promise<T>): Promise<T> {
    try {
      return await action();
    } catch (error) {
      if (error instanceof DuplicateSeatLabelError) {
        throw new DomainException('SEAT_LABEL_TAKEN', 'มีชื่อนี้แล้ว', 409);
      }
      throw error;
    }
  }

  private notifyDeactivation(outcome: DeactivationOutcome): void {
    if (outcome.bellCleared) {
      this.notifications.emitToStaff(TABLE_STAFF_CALL_CLEARED, {
        tableSeatId: outcome.seat.id,
        acknowledgedBy: null,
      });
    }
    this.emitTablesChanged([outcome.seat.id]);
  }

  private emitTablesChanged(seatIds: string[]): void {
    this.notifications.emitToStaff(TABLES_CHANGED, { seatIds });
  }

  private mapSeat(record: SeatAdminRecord): SeatAdmin {
    return {
      id: record.id,
      label: record.label,
      kind: record.kind,
      sortOrder: record.sortOrder,
      isActive: record.isActive,
      qrToken: record.qrToken,
      hasLiveVisit: record.hasLiveVisit,
    };
  }

  private buildCreateAudit(seat: SeatAdminRecord): AuditRecord {
    return {
      entity: 'table_seat',
      entityId: seat.id,
      action: 'CREATE',
      changedFields: {
        label: { from: null, to: seat.label },
        kind: { from: null, to: seat.kind },
        sort_order: { from: null, to: String(seat.sortOrder) },
        is_active: { from: null, to: 'true' },
      },
    };
  }

  private buildUpdateAudit(before: SeatAdminRecord, after: SeatAdminRecord): AuditRecord {
    const changedFields: Record<string, AuditFieldChange> = {};
    if (before.label !== after.label) changedFields['label'] = { from: before.label, to: after.label };
    if (before.kind !== after.kind) changedFields['kind'] = { from: before.kind, to: after.kind };
    if (before.sortOrder !== after.sortOrder) {
      changedFields['sort_order'] = { from: String(before.sortOrder), to: String(after.sortOrder) };
    }
    return {
      entity: 'table_seat',
      entityId: after.id,
      action: 'UPDATE',
      changedFields,
    };
  }

  private buildReorderAudit(firstId: string, ids: readonly string[]): AuditRecord {
    return {
      entity: 'table_seat',
      entityId: firstId,
      action: 'UPDATE',
      changedFields: { sort_order: { from: null, to: ids.join(',') } },
    };
  }

  private buildActiveAudit(id: string, isActive: boolean): AuditRecord {
    return {
      entity: 'table_seat',
      entityId: id,
      action: 'UPDATE',
      changedFields: {
        is_active: { from: String(!isActive), to: String(isActive) },
      },
    };
  }
}
