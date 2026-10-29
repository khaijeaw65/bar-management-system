import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../providers/redis/redis.service.js';

/** Abuse guard (DR-028): Redis holds only data that is fine to lose, so an outage lets guests through. */
@Injectable()
export class CustomerThrottle {
  private readonly logger = new Logger(CustomerThrottle.name);

  public constructor(private readonly redis: RedisService) {}

  /** True while `key` has been hit at most `limit` times in the current `windowSeconds` window. */
  public async allow(key: string, limit: number, windowSeconds: number): Promise<boolean> {
    try {
      const results = await this.redis.client
        .multi()
        .set(key, 0, 'EX', windowSeconds, 'NX')
        .incr(key)
        .exec();
      const hits = results?.[1]?.[1];
      if (typeof hits !== 'number') throw new Error('throttle counter missing');
      return hits <= limit;
    } catch (error) {
      this.logger.warn(`throttle ${key.split(':')[1] ?? 'key'} failed open: ${error instanceof Error ? error.message : 'error'}`);
      return true;
    }
  }
}
