import { Inject, Injectable, Logger } from '@nestjs/common';
import { MyPermissionsSchema, type MyPermissions, type PermissionCode } from '@bar/contracts';
import { activeGroups, cacheTtlSeconds } from '../domain/effective-access.js';
import { PERMISSION_SOURCE, type PermissionSource } from '../domain/permission-source.js';
import { RedisService } from '../../../providers/redis/redis.service.js';
import { IamVersion } from './iam-version.service.js';

const EMPTY: MyPermissions = { permissions: [], groups: [] };

/**
 * Effective permissions = policies of the groups live at `now` ∪ the user's own policies (most permissive wins).
 * Cached in Redis under the global IAM version; Redis is only a cache, so any Redis failure falls through to the DB.
 */
@Injectable()
export class PermissionResolver {
  private readonly logger = new Logger(PermissionResolver.name);

  public constructor(
    @Inject(PERMISSION_SOURCE) private readonly source: PermissionSource,
    private readonly redis: RedisService,
    private readonly version: IamVersion,
  ) {}

  public async effectiveFor(userId: string, now: Date): Promise<Set<PermissionCode>> {
    const access = await this.accessFor(userId, now);
    return new Set(access.permissions);
  }

  public async accessFor(userId: string, now: Date): Promise<MyPermissions> {
    const key = await this.cacheKey(userId);
    if (key) {
      const hit = await this.read(key);
      if (hit) return hit;
    }
    const computed = await this.compute(userId, now);
    if (key && computed.ttlSeconds > 0) await this.write(key, computed.access, computed.ttlSeconds);
    return computed.access;
  }

  private async compute(userId: string, now: Date): Promise<{ access: MyPermissions; ttlSeconds: number }> {
    if (!(await this.source.isActiveStaff(userId))) return { access: EMPTY, ttlSeconds: 0 };
    const { groups, nextChange } = activeGroups(await this.source.membershipsOf(userId), now);
    const codes = await this.source.codesFor(
      userId,
      groups.map((group) => group.id),
    );
    return {
      access: { permissions: [...new Set(codes)].sort((left, right) => left.localeCompare(right)), groups },
      ttlSeconds: cacheTtlSeconds(nextChange, now),
    };
  }

  private async cacheKey(userId: string): Promise<string | null> {
    try {
      return `perms:${userId}:v${await this.version.current()}`;
    } catch (error) {
      this.logger.warn(`IAM cache unavailable, reading the database: ${String(error)}`);
      return null;
    }
  }

  private async read(key: string): Promise<MyPermissions | null> {
    try {
      const raw = await this.redis.client.get(key);
      if (raw === null) return null;
      const parsed = MyPermissionsSchema.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : null;
    } catch (error) {
      this.logger.warn(`IAM cache read failed: ${String(error)}`);
      return null;
    }
  }

  private async write(key: string, access: MyPermissions, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.client.set(key, JSON.stringify(access), 'EX', ttlSeconds);
    } catch (error) {
      this.logger.warn(`IAM cache write failed: ${String(error)}`);
    }
  }
}
