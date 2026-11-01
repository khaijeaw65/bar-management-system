import { Logger } from '@nestjs/common';
import type { PermissionCode } from '@bar/contracts';
import type { PermissionSource } from '../domain/permission-source.js';
import type { MembershipRow } from '../domain/permission-source.types.js';
import type { RedisService } from '../../../providers/redis/redis.service.js';
import { IamVersion } from './iam-version.service.js';
import { PermissionResolver } from './permission-resolver.service.js';

const NOW = new Date('2026-10-30T10:00:00.000Z');

class FakeRedis {
  public readonly store = new Map<string, { value: string; ttl: number }>();
  public down = false;

  public readonly client = {
    get: (key: string): Promise<string | null> => {
      if (this.down) return Promise.reject(new Error('redis down'));
      return Promise.resolve(this.store.get(key)?.value ?? null);
    },
    set: (key: string, value: string, _mode: string, ttl: number): Promise<'OK'> => {
      if (this.down) return Promise.reject(new Error('redis down'));
      this.store.set(key, { value, ttl });
      return Promise.resolve('OK');
    },
    incr: (key: string): Promise<number> => {
      const next = Number(this.store.get(key)?.value ?? 0) + 1;
      this.store.set(key, { value: String(next), ttl: 0 });
      return Promise.resolve(next);
    },
  };
}

class FakeSource implements PermissionSource {
  public active = true;
  public memberships: MembershipRow[] = [];
  public codes: PermissionCode[] = ['orders:read', 'orders:create'];
  public loads = 0;

  public isActiveStaff(): Promise<boolean> {
    this.loads += 1;
    return Promise.resolve(this.active);
  }
  public membershipsOf(): Promise<MembershipRow[]> {
    return Promise.resolve(this.memberships);
  }
  public codesFor(_userId: string, groupIds: string[]): Promise<PermissionCode[]> {
    return Promise.resolve(groupIds.length > 0 ? this.codes : []);
  }
  public staffHolding(): Promise<string[]> {
    return Promise.resolve([]);
  }
  public everHadOwner(): Promise<boolean> {
    return Promise.resolve(true);
  }
}

const membership = (validUntil: string | null, validFrom = '2026-10-01T00:00:00.000Z'): MembershipRow => ({
  groupId: '00000000-0000-4000-8000-0000000b0003',
  groupName: 'พนักงาน',
  validFrom: new Date(validFrom),
  validUntil: validUntil ? new Date(validUntil) : null,
});

function build(): { resolver: PermissionResolver; source: FakeSource; redis: FakeRedis; version: IamVersion } {
  const source = new FakeSource();
  const redis = new FakeRedis();
  const version = new IamVersion(redis as unknown as RedisService);
  const resolver = new PermissionResolver(source, redis as unknown as RedisService, version);
  return { resolver, source, redis, version };
}

describe('PermissionResolver', () => {
  beforeEach(() => {
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => vi.restoreAllMocks());

  it('returns the union of the live groups’ permissions and the groups themselves', async () => {
    const { resolver, source } = build();
    source.memberships = [membership(null)];
    const access = await resolver.accessFor('u1', NOW);
    expect(access.permissions).toEqual(['orders:create', 'orders:read']);
    expect(access.groups).toEqual([{ id: '00000000-0000-4000-8000-0000000b0003', name: 'พนักงาน', validUntil: null }]);
  });

  it('gives nothing from an ended or not-yet-started membership (AC-4)', async () => {
    const { resolver, source } = build();
    source.memberships = [membership('2026-10-30T09:00:00.000Z')];
    expect((await resolver.accessFor('u1', NOW)).permissions).toEqual([]);
    source.memberships = [membership(null, '2026-10-30T11:00:00.000Z')];
    expect((await resolver.accessFor('u2', NOW)).permissions).toEqual([]);
  });

  it('gives an inactive user nothing and does not cache it', async () => {
    const { resolver, source, redis } = build();
    source.active = false;
    source.memberships = [membership(null)];
    expect((await resolver.effectiveFor('u1', NOW)).size).toBe(0);
    expect([...redis.store.keys()].filter((key) => key.startsWith('perms:'))).toEqual([]);
  });

  it('caches the second read: no source query (AC-5)', async () => {
    const { resolver, source } = build();
    source.memberships = [membership(null)];
    await resolver.accessFor('u1', NOW);
    await resolver.accessFor('u1', NOW);
    expect(source.loads).toBe(1);
  });

  it('recomputes after the IAM version is bumped (AC-5)', async () => {
    const { resolver, source, version } = build();
    source.memberships = [membership(null)];
    await resolver.accessFor('u1', NOW);
    await version.bump();
    source.codes = ['orders:read'];
    expect((await resolver.accessFor('u1', NOW)).permissions).toEqual(['orders:read']);
    expect(source.loads).toBe(2);
  });

  it('caps the cache lifetime at the membership end (AC-4)', async () => {
    const { resolver, source, redis } = build();
    source.memberships = [membership('2026-10-30T10:00:30.000Z')];
    await resolver.accessFor('u1', NOW);
    const entry = redis.store.get('perms:u1:v0');
    expect(entry?.ttl).toBe(30);
  });

  it('caps the cache lifetime at a future membership start too', async () => {
    const { resolver, source, redis } = build();
    source.memberships = [membership(null, '2026-10-30T10:00:10.000Z')];
    await resolver.accessFor('u1', NOW);
    expect(redis.store.get('perms:u1:v0')?.ttl).toBe(10);
  });

  it('falls back to the database when Redis is down (AC-5)', async () => {
    const { resolver, source, redis } = build();
    source.memberships = [membership(null)];
    redis.down = true;
    expect((await resolver.accessFor('u1', NOW)).permissions).toEqual(['orders:create', 'orders:read']);
    expect((await resolver.accessFor('u1', NOW)).permissions).toEqual(['orders:create', 'orders:read']);
    expect(source.loads).toBe(2);
  });

  it('ignores a corrupt cache entry', async () => {
    const { resolver, source, redis } = build();
    source.memberships = [membership(null)];
    redis.store.set('perms:u1:v0', { value: '{"nope":true}', ttl: 60 });
    expect((await resolver.accessFor('u1', NOW)).permissions).toEqual(['orders:create', 'orders:read']);
  });
});
