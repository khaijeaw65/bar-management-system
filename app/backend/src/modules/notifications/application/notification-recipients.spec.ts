import { describe, expect, it, vi } from 'vitest';
import type { PermissionCode } from '@bar/contracts';
import type { Clock } from '../../../common/clock.js';
import type { PermissionResolver } from '../../iam/application/permission-resolver.service.js';
import { NotificationRecipients } from './notification-recipients.js';

describe('NotificationRecipients', () => {
  const fixedNow = new Date('2026-10-31T12:00:00.000Z');
  const clock: Clock = { now: () => fixedNow };

  const createService = (overrides: {
    staffHolding?: (code: PermissionCode, now: Date) => Promise<string[]>;
    effectiveFor?: (userId: string, now: Date) => Promise<Set<PermissionCode>>;
  } = {}) => {
    const resolver = {
      staffHolding: vi.fn(overrides.staffHolding ?? (() => Promise.resolve([]))),
      effectiveFor: vi.fn(overrides.effectiveFor ?? (() => Promise.resolve(new Set<PermissionCode>()))),
    } as unknown as PermissionResolver;

    return {
      service: new NotificationRecipients(resolver, clock),
      resolver,
    };
  };

  it('AC-1: orderNew returns holders of orders:update_status excluding the placer', async () => {
    const { service } = createService({
      staffHolding: async (code) => {
        if (code === 'orders:update_status') {
          return ['staff-1', 'staff-2', 'placer-3'];
        }
        return [];
      },
    });

    const recipients = await service.orderNew('placer-3');
    expect(recipients).toEqual(['staff-1', 'staff-2']);
  });

  it('AC-1: orderNew includes all holders when no placer is specified (e.g. guest order)', async () => {
    const { service } = createService({
      staffHolding: async (code) => {
        if (code === 'orders:update_status') {
          return ['staff-1', 'staff-2'];
        }
        return [];
      },
    });

    const recipients = await service.orderNew(null);
    expect(recipients).toEqual(['staff-1', 'staff-2']);
  });

  it('AC-2: callStaff returns active holders of tables:read', async () => {
    const { service } = createService({
      staffHolding: async (code) => {
        if (code === 'tables:read') {
          return ['staff-1', 'staff-3'];
        }
        return [];
      },
    });

    const recipients = await service.callStaff();
    expect(recipients).toEqual(['staff-1', 'staff-3']);
  });

  it('AC-3: foodReady delivers to order creator when they hold orders:read', async () => {
    const { service } = createService({
      effectiveFor: async (userId) => {
        if (userId === 'creator-1') {
          return new Set<PermissionCode>(['orders:read', 'orders:create']);
        }
        return new Set<PermissionCode>();
      },
    });

    const recipients = await service.foodReady('creator-1');
    expect(recipients).toEqual(['creator-1']);
  });

  it('AC-3: foodReady falls back to orders:update_status when creator lacks orders:read', async () => {
    const { service } = createService({
      effectiveFor: async () => new Set<PermissionCode>(['menu:read']),
      staffHolding: async (code) => {
        if (code === 'orders:update_status') {
          return ['staff-2', 'staff-3'];
        }
        return [];
      },
    });

    const recipients = await service.foodReady('creator-without-read');
    expect(recipients).toEqual(['staff-2', 'staff-3']);
  });

  it('AC-3: foodReady falls back to orders:update_status when creator is null (QR order)', async () => {
    const { service } = createService({
      staffHolding: async (code) => {
        if (code === 'orders:update_status') {
          return ['staff-2', 'staff-3'];
        }
        return [];
      },
    });

    const recipients = await service.foodReady(null);
    expect(recipients).toEqual(['staff-2', 'staff-3']);
  });

  it('AC-4: returns empty array when no active staff hold the permission', async () => {
    const { service } = createService({
      staffHolding: async () => [],
    });

    const recipients = await service.callStaff();
    expect(recipients).toEqual([]);
  });
});
