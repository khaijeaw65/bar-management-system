import { Injectable, Logger } from '@nestjs/common';
import { DomainException } from '../../../common/domain-exception.js';
import { RedisService } from '../../../providers/redis/redis.service.js';

const WINDOW_SECONDS = 300; // 5 minutes
const MAX_ATTEMPTS = 5;

@Injectable()
export class PinThrottleService {
  private readonly logger = new Logger(PinThrottleService.name);

  public constructor(private readonly redis: RedisService) {}

  public async assertNotLocked(callerId: string): Promise<void> {
    try {
      const key = this.key(callerId);
      const val = await this.redis.client.get(key);
      if (val !== null && Number(val) >= MAX_ATTEMPTS) {
        throw new DomainException('PIN_LOCKED', 'PIN ถูกล็อค กรุณารอ 5 นาที', 429);
      }
    } catch (error) {
      if (error instanceof DomainException) throw error;
      this.logger.warn(`pin throttle assert failed open: ${error instanceof Error ? error.message : 'error'}`);
    }
  }

  public async recordFailure(callerId: string): Promise<void> {
    try {
      const key = this.key(callerId);
      await this.redis.client
        .multi()
        .set(key, 0, 'EX', WINDOW_SECONDS, 'NX')
        .incr(key)
        .exec();
    } catch (error) {
      this.logger.warn(`pin throttle record failed open: ${error instanceof Error ? error.message : 'error'}`);
    }
  }

  public async reset(callerId: string): Promise<void> {
    try {
      await this.redis.client.del(this.key(callerId));
    } catch {
      // The key simply expires on its own.
    }
  }

  private key(callerId: string): string {
    return `pin:throttle:${callerId}`;
  }
}
