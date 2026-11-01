import { describe, expect, it, vi } from 'vitest';
import type { AuditLogService } from '../../../common/audit/audit-log.service.js';
import { DomainException } from '../../../common/domain-exception.js';
import { PinHasher } from '../domain/pin-hasher.js';
import type { StaffUserRepository } from '../domain/staff-user.repository.js';
import { StaffPinService } from './staff-pin.service.js';

describe('StaffPinService', () => {
  const staffId = '11111111-1111-4111-8111-111111111111';
  const otherId = '22222222-2222-4222-8222-222222222222';

  it('sets PIN for the first time without currentPin', async () => {
    let savedHash: string | null = null;
    const repo = {
      findPinById: vi.fn().mockResolvedValue({
        id: staffId,
        displayName: 'สมชาย',
        isActive: true,
        posPinHash: null,
      }),
      findActiveWithPin: vi.fn().mockResolvedValue([]),
      savePin: vi.fn().mockImplementation((_id, hash) => {
        savedHash = hash;
      }),
    } as unknown as StaffUserRepository;

    const audit = { record: vi.fn() } as unknown as AuditLogService;
    const service = new StaffPinService(repo, audit);

    const result = await service.setPin(staffId, { pin: '1234' });
    expect(result).toEqual({ ok: true });
    expect(savedHash).toBeTruthy();
    expect(PinHasher.verify('1234', savedHash!)).toBe(true);
  });

  it('requires valid currentPin when changing an existing PIN', async () => {
    const existingHash = PinHasher.hash('1234');
    const repo = {
      findPinById: vi.fn().mockResolvedValue({
        id: staffId,
        displayName: 'สมชาย',
        isActive: true,
        posPinHash: existingHash,
      }),
      findActiveWithPin: vi.fn().mockResolvedValue([]),
      savePin: vi.fn(),
    } as unknown as StaffUserRepository;

    const audit = { record: vi.fn() } as unknown as AuditLogService;
    const service = new StaffPinService(repo, audit);

    await expect(service.setPin(staffId, { pin: '5678' })).rejects.toThrow(DomainException);
    await expect(service.setPin(staffId, { pin: '5678', currentPin: '0000' })).rejects.toThrow(DomainException);
    await expect(service.setPin(staffId, { pin: '5678', currentPin: '1234' })).resolves.toEqual({ ok: true });
  });

  it('rejects a PIN already used by another active staff member with 409 PIN_UNAVAILABLE', async () => {
    const otherHash = PinHasher.hash('9999');
    const repo = {
      findPinById: vi.fn().mockResolvedValue({
        id: staffId,
        displayName: 'สมชาย',
        isActive: true,
        posPinHash: null,
      }),
      findActiveWithPin: vi.fn().mockResolvedValue([
        { id: otherId, displayName: 'สมศรี', isActive: true, posPinHash: otherHash },
      ]),
      savePin: vi.fn(),
    } as unknown as StaffUserRepository;

    const audit = { record: vi.fn() } as unknown as AuditLogService;
    const service = new StaffPinService(repo, audit);

    await expect(service.setPin(staffId, { pin: '9999' })).rejects.toThrow(DomainException);
  });

  it('resets PIN to null and records audit log', async () => {
    const audits: unknown[] = [];
    const repo = {
      findPinById: vi.fn().mockResolvedValue({
        id: staffId,
        displayName: 'สมชาย',
        isActive: true,
        posPinHash: 'some-hash',
      }),
      savePin: vi.fn(),
    } as unknown as StaffUserRepository;

    const audit = {
      record: vi.fn().mockImplementation((entry) => audits.push(entry)),
    } as unknown as AuditLogService;

    const service = new StaffPinService(repo, audit);
    await service.resetPin(staffId);

    expect(repo.savePin).toHaveBeenCalledWith(staffId, null);
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({
      entity: 'staff_user',
      entityId: staffId,
      action: 'UPDATE',
      changedFields: { posPinHash: { from: 'REDACTED', to: null } },
    });
  });
});
