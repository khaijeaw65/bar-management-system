import { Injectable } from '@nestjs/common';
import { Clock } from '../../../common/clock.js';
import { DomainException } from '../../../common/domain-exception.js';
import { PermissionResolver } from '../../iam/application/permission-resolver.service.js';
import { PinThrottleService } from '../../iam/application/pin-throttle.service.js';
import { StaffPinService } from '../../iam/application/staff-pin.service.js';
import type { ApprovalOutcome, ResolveApprovalInput } from './approval.types.js';

@Injectable()
export class ApprovalService {
  public constructor(
    private readonly staffPin: StaffPinService,
    private readonly permissions: PermissionResolver,
    private readonly throttle: PinThrottleService,
    private readonly clock: Clock,
  ) {}

  public async resolve(input: ResolveApprovalInput): Promise<ApprovalOutcome> {
    const code = input.kind === 'void' ? 'orders:void' : 'orders:comp';
    if (!input.pin) return await this.resolveSelfApproval(input.callerId, code);
    return await this.resolvePinApproval(input.callerId, input.pin, code);
  }

  private async resolveSelfApproval(callerId: string, code: 'orders:void' | 'orders:comp'): Promise<ApprovalOutcome> {
    const callerPerms = await this.permissions.effectiveFor(callerId, this.clock.now());
    if (!callerPerms.has(code)) {
      throw new DomainException('FORBIDDEN', 'ไม่มีสิทธิ์ทำรายการนี้', 403);
    }
    return { approvedBy: null, selfApproved: true };
  }

  private async resolvePinApproval(
    callerId: string,
    pin: string,
    code: 'orders:void' | 'orders:comp',
  ): Promise<ApprovalOutcome> {
    await this.throttle.assertNotLocked(callerId);
    const matched = await this.staffPin.findActiveStaffByPin(pin);
    if (!matched) return await this.failPin(callerId);
    if (matched.id === callerId) return await this.resolveSelfWithPin(callerId, code);
    return await this.resolveApproverWithPin(callerId, matched.id, code);
  }

  private async resolveSelfWithPin(callerId: string, code: 'orders:void' | 'orders:comp'): Promise<ApprovalOutcome> {
    const callerPerms = await this.permissions.effectiveFor(callerId, this.clock.now());
    if (!callerPerms.has(code)) return await this.failPin(callerId);
    await this.throttle.reset(callerId);
    return { approvedBy: null, selfApproved: true };
  }

  private async resolveApproverWithPin(
    callerId: string,
    approverId: string,
    code: 'orders:void' | 'orders:comp',
  ): Promise<ApprovalOutcome> {
    const approverPerms = await this.permissions.effectiveFor(approverId, this.clock.now());
    if (!approverPerms.has(code)) return await this.failPin(callerId);
    await this.throttle.reset(callerId);
    return { approvedBy: approverId, selfApproved: false };
  }

  private async failPin(callerId: string): Promise<never> {
    await this.throttle.recordFailure(callerId);
    throw new DomainException('PIN_INVALID', 'PIN ไม่ถูกต้อง', 422);
  }
}
