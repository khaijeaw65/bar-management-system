import type { Redis } from 'ioredis';
import { DomainException } from '../domain-exception.js';
import { RedisService } from '../../providers/redis/redis.service.js';
import { IdempotencyService } from './idempotency.service.js';
import { requestHash } from './request-hash.js';

describe('idempotency while a placement is still running', () => {
  it('returns CONFLICT for the same body', async () => {
    const service = new IdempotencyService(redisOf(new MemoryRedis()));
    const hash = requestHash({ visitId: 'v', items: [] });
    await service.begin({ scope: 'order', key: 'key', hash });
    await expect(service.begin({ scope: 'order', key: 'key', hash })).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'คำสั่งนี้กำลังดำเนินการ ลองอีกครั้ง',
    });
  });

  it('keeps IDEMPOTENCY_KEY_REUSED when the body differs', async () => {
    const service = new IdempotencyService(redisOf(new MemoryRedis()));
    await service.begin({ scope: 'order', key: 'key', hash: requestHash({ visitId: 'v' }) });
    const error = service.begin({ scope: 'order', key: 'key', hash: requestHash({ visitId: 'other' }) });
    await expect(error).rejects.toBeInstanceOf(DomainException);
    await expect(error).rejects.toMatchObject({ code: 'IDEMPOTENCY_KEY_REUSED' });
  });

  it('returns CONFLICT when the first request drops the key while a retry is polling', async () => {
    const redis = new MemoryRedis();
    const service = new IdempotencyService(redisOf(redis));
    await service.begin({ scope: 'order', key: 'key', hash: 'hash' });
    const second = service.begin({ scope: 'order', key: 'key', hash: 'hash' });
    await new Promise((resolve) => setTimeout(resolve, 10));
    await service.cancel('order', 'key');
    await expect(second).rejects.toMatchObject({ code: 'CONFLICT', message: 'กำลังดำเนินการ' });
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

  public async del(key: string): Promise<number> {
    return this.values.delete(key) ? 1 : 0;
  }
}
