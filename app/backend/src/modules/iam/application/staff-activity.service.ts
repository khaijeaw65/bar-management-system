import { Inject, Injectable, Logger } from '@nestjs/common';
import { PERMISSION_SOURCE, type PermissionSource } from '../domain/permission-source.js';
import { RedisService } from '../../../providers/redis/redis.service.js';
import { IamVersion } from './iam-version.service.js';

const CACHE_SECONDS = 300;

/**
 * "Inactive = logged out" on every token (BRIEF-054 audit Must fix 1): independent of the session index,
 * so sessions issued before it existed end too. Cached under the global IAM version — deactivating or
 * reactivating bumps it — and Redis is only a cache, so any Redis failure falls through to the DB.
 */
@Injectable()
export class StaffActivity {
  private readonly logger = new Logger(StaffActivity.name);

  public constructor(
    @Inject(PERMISSION_SOURCE) private readonly source: PermissionSource,
    private readonly redis: RedisService,
    private readonly version: IamVersion,
  ) {}

  public async isActive(userId: string): Promise<boolean> {
    const key = await this.cacheKey(userId);
    const cached = await this.read(key);
    if (cached !== null) return cached;
    const active = await this.source.isActiveStaff(userId);
    await this.write(key, active);
    return active;
  }

  private async cacheKey(userId: string): Promise<string | null> {
    try {
      return `staff-active:${userId}:v${await this.version.current()}`;
    } catch (error) {
      this.logger.warn(`IAM version unreadable, using the database: ${String(error)}`);
      return null;
    }
  }

  private async read(key: string | null): Promise<boolean | null> {
    if (key === null) return null;
    try {
      const raw = await this.redis.client.get(key);
      return raw === null ? null : raw === '1';
    } catch {
      return null;
    }
  }

  private async write(key: string | null, active: boolean): Promise<void> {
    if (key === null) return;
    try {
      await this.redis.client.set(key, active ? '1' : '0', 'EX', CACHE_SECONDS);
    } catch {
      // cache only
    }
  }
}
