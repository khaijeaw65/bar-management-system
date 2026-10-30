import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../providers/redis/redis.service.js';

export const IAM_VERSION_KEY = 'iam:version';

/** Global cache generation. Every IAM write bumps it, so every cached permission set goes stale at once. */
@Injectable()
export class IamVersion {
  public constructor(private readonly redis: RedisService) {}

  public async current(): Promise<number> {
    const raw = await this.redis.client.get(IAM_VERSION_KEY);
    return raw === null ? 0 : Number(raw);
  }

  public async bump(): Promise<void> {
    await this.redis.client.incr(IAM_VERSION_KEY);
  }
}
