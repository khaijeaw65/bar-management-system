import { describe, expect, it, vi } from 'vitest';
import type { Clock } from '../../../common/clock.js';
import { DomainException } from '../../../common/domain-exception.js';
import type { PermissionResolver } from '../../iam/application/permission-resolver.service.js';
import type { PinThrottleService } from '../../iam/application/pin-throttle.service.js';
import type { StaffPinService } from '../../iam/application/staff-pin.service.js';
import { ApprovalService } from './approval.service.js';

describe('ApprovalService', () => {
  const callerId = '11111111-1111-4111-8111-111111111111';
  const managerId = '22222222-2222-4222-8222-222222222222';
  const now = new Date('2026-10-31T12:00:00.000Z');
  const clock = { now: () => now } as Clock;

  it('self-approves when caller has orders:void and no PIN is provided', async () => {
    const staffPin = {} as StaffPinService;
    const permissions = {
      effectiveFor: vi.fn().mockResolvedValue(new Set(['orders:void'])),
    } as unknown as PermissionResolver;
    const throttle = {} as PinThrottleService;

    const service = new ApprovalService(staffPin, permissions, throttle, clock);
    const result = await service.resolve({ callerId, kind: 'void' });
    expect(result).toEqual({ approvedBy: null, selfApproved: true });
  });

  it('rejects self-approve with 403 when caller lacks orders:void', async () => {
    const staffPin = {} as StaffPinService;
    const permissions = {
      effectiveFor: vi.fn().mockResolvedValue(new Set(['orders:read'])),
    } as unknown as PermissionResolver;
    const throttle = {} as PinThrottleService;

    const service = new ApprovalService(staffPin, permissions, throttle, clock);
    await expect(service.resolve({ callerId, kind: 'void' })).rejects.toThrow(DomainException);
  });

  it('approves with manager PIN when manager holds orders:void', async () => {
    const staffPin = {
      findActiveStaffByPin: vi.fn().mockResolvedValue({ id: managerId, displayName: 'ผู้จัดการ' }),
    } as unknown as StaffPinService;
    const permissions = {
      effectiveFor: vi.fn().mockImplementation((userId) => {
        if (userId === managerId) return Promise.resolve(new Set(['orders:void']));
        return Promise.resolve(new Set([]));
      }),
    } as unknown as PermissionResolver;
    const throttle = {
      assertNotLocked: vi.fn(),
      reset: vi.fn(),
    } as unknown as PinThrottleService;

    const service = new ApprovalService(staffPin, permissions, throttle, clock);
    const result = await service.resolve({ callerId, pin: '1234', kind: 'void' });
    expect(result).toEqual({ approvedBy: managerId, selfApproved: false });
    expect(throttle.reset).toHaveBeenCalledWith(callerId);
  });

  it('rejects and increments failure when PIN matches nobody', async () => {
    const staffPin = {
      findActiveStaffByPin: vi.fn().mockResolvedValue(null),
    } as unknown as StaffPinService;
    const permissions = {} as unknown as PermissionResolver;
    const throttle = {
      assertNotLocked: vi.fn(),
      recordFailure: vi.fn(),
    } as unknown as PinThrottleService;

    const service = new ApprovalService(staffPin, permissions, throttle, clock);
    await expect(service.resolve({ callerId, pin: '9999', kind: 'void' })).rejects.toThrow(DomainException);
    expect(throttle.recordFailure).toHaveBeenCalledWith(callerId);
  });

  it('rejects and increments failure when PIN belongs to staff without the code', async () => {
    const staffPin = {
      findActiveStaffByPin: vi.fn().mockResolvedValue({ id: 'staff-no-code', displayName: 'น้องฝึกงาน' }),
    } as unknown as StaffPinService;
    const permissions = {
      effectiveFor: vi.fn().mockResolvedValue(new Set([])),
    } as unknown as PermissionResolver;
    const throttle = {
      assertNotLocked: vi.fn(),
      recordFailure: vi.fn(),
    } as unknown as PinThrottleService;

    const service = new ApprovalService(staffPin, permissions, throttle, clock);
    await expect(service.resolve({ callerId, pin: '5555', kind: 'void' })).rejects.toThrow(DomainException);
    expect(throttle.recordFailure).toHaveBeenCalledWith(callerId);
  });

  it('treats PIN matching caller as self-approve', async () => {
    const staffPin = {
      findActiveStaffByPin: vi.fn().mockResolvedValue({ id: callerId, displayName: 'ผู้จัดการคนเดียว' }),
    } as unknown as StaffPinService;
    const permissions = {
      effectiveFor: vi.fn().mockResolvedValue(new Set(['orders:comp'])),
    } as unknown as PermissionResolver;
    const throttle = {
      assertNotLocked: vi.fn(),
      reset: vi.fn(),
    } as unknown as PinThrottleService;

    const service = new ApprovalService(staffPin, permissions, throttle, clock);
    const result = await service.resolve({ callerId, pin: '1234', kind: 'comp' });
    expect(result).toEqual({ approvedBy: null, selfApproved: true });
    expect(throttle.reset).toHaveBeenCalledWith(callerId);
  });
});
