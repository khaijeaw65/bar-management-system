import type { RedisService } from '../../../providers/redis/redis.service.js';
import { CustomerThrottle } from './customer-throttle.js';

function redisReturning(hits: number): RedisService {
  const chain = {
    set: () => chain,
    incr: () => chain,
    exec: async () => [[null, 'OK'], [null, hits]],
  };
  return { client: { multi: () => chain } } as unknown as RedisService;
}

describe('CustomerThrottle', () => {
  it('allows up to the limit and blocks the next hit', async () => {
    expect(await new CustomerThrottle(redisReturning(30)).allow('customer:scan:ip', 30, 60)).toBe(true);
    expect(await new CustomerThrottle(redisReturning(31)).allow('customer:scan:ip', 30, 60)).toBe(false);
  });

  it('fails open when Redis errors (AC-9)', async () => {
    const redis = {
      client: {
        multi: () => {
          throw new Error('ECONNREFUSED');
        },
      },
    } as unknown as RedisService;
    expect(await new CustomerThrottle(redis).allow('customer:scan:ip', 30, 60)).toBe(true);
  });

  it('fails open when the transaction is discarded', async () => {
    const chain = { set: () => chain, incr: () => chain, exec: async () => null };
    const redis = { client: { multi: () => chain } } as unknown as RedisService;
    expect(await new CustomerThrottle(redis).allow('customer:scan:ip', 30, 60)).toBe(true);
  });
});
