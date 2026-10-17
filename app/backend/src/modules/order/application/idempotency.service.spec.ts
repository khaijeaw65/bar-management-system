import type { Redis } from 'ioredis';
import { DomainException } from '../../../common/domain-exception.js';
import { RedisService } from '../../../providers/redis/redis.service.js';
import { IdempotencyService } from './idempotency.service.js';
import { requestHash } from './request-hash.js';

describe('idempotency while a placement is still running', () => {
  it('returns CONFLICT for the same body', async () => {
    const service = new IdempotencyService(redisOf(new MemoryRedis()));
    const hash = requestHash({ visitId: 'v', items: [] });
    await service.begin('key', hash);
    await expect(service.begin('key', hash)).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'คำสั่งนี้กำลังดำเนินการ ลองอีกครั้ง',
    });
  });

  it('keeps IDEMPOTENCY_KEY_REUSED when the body differs', async () => {
    const service = new IdempotencyService(redisOf(new MemoryRedis()));
    await service.begin('key', requestHash({ visitId: 'v' }));
    const error = service.begin('key', requestHash({ visitId: 'other' }));
    await expect(error).rejects.toBeInstanceOf(DomainException);
    await expect(error).rejects.toMatchObject({ code: 'IDEMPOTENCY_KEY_REUSED' });
  });
});

function redisOf(client: MemoryRedis): RedisService {
  return { client: client as unknown as Redis } as RedisService;
}

class MemoryRedis {
  private readonly values = new Map<string, string>();

  public async get(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  public async set(key: string, value: string, ...rest: string[]): Promise<'OK' | null> {
    if (rest.includes('NX') && this.values.has(key)) return null;
    this.values.set(key, value);
    return 'OK';
  }
}
