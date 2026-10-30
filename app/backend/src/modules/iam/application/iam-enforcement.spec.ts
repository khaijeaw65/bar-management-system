import { Logger } from '@nestjs/common';
import type { PermissionSource } from '../domain/permission-source.js';
import { IamEnforcement } from './iam-enforcement.service.js';

const NOW = new Date('2026-10-30T10:00:00.000Z');
const later = (seconds: number): Date => new Date(NOW.getTime() + seconds * 1000);

function build(owner: { present: boolean; fails?: boolean }): { service: IamEnforcement; checks: () => number } {
  let calls = 0;
  const source = {
    everHadOwner: (): Promise<boolean> => {
      calls += 1;
      if (owner.fails) return Promise.reject(new Error('db down'));
      return Promise.resolve(owner.present);
    },
  } as unknown as PermissionSource;
  return { service: new IamEnforcement(source), checks: () => calls };
}

describe('IamEnforcement', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => vi.restoreAllMocks());

  it('enforces while an owner exists and trusts the answer for a minute', async () => {
    const owner = { present: true };
    const { service, checks } = build(owner);
    expect(await service.isEnforcing(NOW)).toBe(true);
    expect(await service.isEnforcing(later(30))).toBe(true);
    expect(checks()).toBe(1);
  });

  it('does not enforce without an owner, warns, and flips as soon as one exists (AC-9)', async () => {
    const owner = { present: false };
    const { service } = build(owner);
    expect(await service.isEnforcing(NOW)).toBe(false);
    expect(warn).toHaveBeenCalledWith('IAM: no owner — permissions NOT enforced');
    owner.present = true;
    expect(await service.isEnforcing(later(1))).toBe(true);
  });

  it('warns at most once a minute', async () => {
    const { service } = build({ present: false });
    await service.isEnforcing(NOW);
    await service.isEnforcing(later(10));
    await service.isEnforcing(later(61));
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('keeps the last answer when the owner check fails', async () => {
    const owner = { present: true, fails: false };
    const { service } = build(owner);
    expect(await service.isEnforcing(NOW)).toBe(true);
    owner.fails = true;
    expect(await service.isEnforcing(later(120))).toBe(true);
  });
});
