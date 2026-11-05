import { describe, expect, it, vi } from 'vitest';
import { DomainException } from '../../../common/domain-exception.js';
import type { RedisService } from '../../../providers/redis/redis.service.js';
import { PinThrottleService } from './pin-throttle.service.js';

describe('PinThrottleService', () => {
  it('allows access when attempts are below 5', async () => {
    const redis = {
      client: {
        get: vi.fn().mockResolvedValue('3'),
      },
    } as unknown as RedisService;

    const service = new PinThrottleService(redis);
    await expect(service.assertNotLocked('caller-1')).resolves.toBeUndefined();
  });

  it('throws 429 PIN_LOCKED when attempts reach or exceed 5', async () => {
    const redis = {
      client: {
        get: vi.fn().mockResolvedValue('5'),
      },
    } as unknown as RedisService;

    const service = new PinThrottleService(redis);
    await expect(service.assertNotLocked('caller-1')).rejects.toThrow(DomainException);
  });

  it('fails open when Redis errors during assert', async () => {
    const redis = {
      client: {
        get: vi.fn().mockRejectedValue(new Error('Redis down')),
      },
    } as unknown as RedisService;

    const service = new PinThrottleService(redis);
    await expect(service.assertNotLocked('caller-1')).resolves.toBeUndefined();
  });
});
