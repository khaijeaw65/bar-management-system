import { Injectable } from '@nestjs/common';
import type { SetPinRequest } from '@bar/contracts';
import { AuditLogService } from '../../../common/audit/audit-log.service.js';
import { DomainException } from '../../../common/domain-exception.js';
import { PinHasher } from '../domain/pin-hasher.js';
import { StaffUserRepository } from '../domain/staff-user.repository.js';
import type { StaffPinRecord } from '../domain/staff-user.types.js';

@Injectable()
export class StaffPinService {
  public constructor(
    private readonly staffUsers: StaffUserRepository,
    private readonly auditLog: AuditLogService,
  ) {}

  public async setPin(staffId: string, input: SetPinRequest): Promise<{ ok: true }> {
    const staff = await this.requireStaff(staffId);
    this.verifyCurrentPin(staff, input.currentPin);
    await this.assertPinUnique(staffId, input.pin);
    await this.staffUsers.savePin(staffId, PinHasher.hash(input.pin));
    return { ok: true };
  }

  public async resetPin(staffId: string): Promise<void> {
    const staff = await this.requireStaff(staffId);
    await this.staffUsers.savePin(staffId, null);
    await this.auditLog.record({
      entity: 'staff_user',
      entityId: staffId,
      action: 'UPDATE',
      changedFields: {
        posPinHash: { from: staff.posPinHash ? 'REDACTED' : null, to: null },
      },
    });
  }

  public async findActiveStaffByPin(pin: string): Promise<StaffPinRecord | null> {
    const activeStaff = await this.staffUsers.findActiveWithPin();
    for (const member of activeStaff) {
      if (member.posPinHash && PinHasher.verify(pin, member.posPinHash)) return member;
    }
    return null;
  }

  private async requireStaff(staffId: string): Promise<StaffPinRecord> {
    const staff = await this.staffUsers.findPinById(staffId);
    if (!staff) throw new DomainException('NOT_FOUND', 'ไม่พบพนักงาน', 404);
    return staff;
  }

  private verifyCurrentPin(staff: StaffPinRecord, currentPin: string | undefined): void {
    if (!staff.posPinHash) return;
    if (!currentPin || !PinHasher.verify(currentPin, staff.posPinHash)) {
      throw new DomainException('PIN_INVALID', 'PIN ไม่ถูกต้อง', 422);
    }
  }

  private async assertPinUnique(staffId: string, newPin: string): Promise<void> {
    const active = await this.staffUsers.findActiveWithPin();
    for (const other of active) {
      if (other.id === staffId || !other.posPinHash) continue;
      if (PinHasher.verify(newPin, other.posPinHash)) {
        throw new DomainException('PIN_UNAVAILABLE', 'ใช้ PIN อื่น', 409);
      }
    }
  }
}
