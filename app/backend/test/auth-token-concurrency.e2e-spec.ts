import { createHash, randomUUID } from 'node:crypto';
import { JwtModule } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Redis } from 'ioredis';
import { JwtConfigService } from '../src/providers/config/jwt/config.service.js';
import { RedisService } from '../src/providers/redis/redis.service.js';
import { StaffActivity } from '../src/modules/iam/application/staff-activity.service.js';
import { TokenService } from '../src/modules/auth/application/token.service.js';
import type { RotateResult } from '../src/modules/auth/application/token.types.js';

const SECRET = 'x'.repeat(32);

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

describe('Refresh rotation atomicity (e2e, real Redis)', () => {
  const redis = new Redis(process.env.REDIS_URL ?? 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: 2,
    connectTimeout: 5_000,
  });
  let tokens: TokenService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: SECRET,
          signOptions: { expiresIn: 900, algorithm: 'HS256' },
        }),
      ],
      providers: [
        TokenService,
        { provide: StaffActivity, useValue: { isActive: () => Promise.resolve(true) } },
        { provide: RedisService, useValue: { client: redis } },
        {
          provide: JwtConfigService,
          useValue: { refreshTtlSeconds: 60, accessSecret: SECRET },
        },
      ],
    }).compile();
    tokens = moduleRef.get(TokenService);
    await redis.ping();
  });

  afterAll(async () => {
    await redis.quit();
  });

  it('logout during rotate leaves no session and no rotatable token', async () => {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const issued = await tokens.createSession(randomUUID());
      await Promise.all([
        tokens.rotate(issued.refreshToken),
        tokens.revokeByRefreshToken(issued.refreshToken),
      ]);
      expect(await tokens.sessionExists(issued.familyId)).toBe(false);
      expect(await redis.exists(`family:${issued.familyId}`)).toBe(0);
      expect(await liveRefreshKeys(redis, issued.familyId)).toEqual([]);
      expect((await tokens.rotate(issued.refreshToken)).status).not.toBe('ok');
    }
  });

  it('a revoked family publishes nothing when rotation runs later', async () => {
    const issued = await tokens.createSession(randomUUID());
    await redis.set(`family-revoked:${issued.familyId}`, '1', 'EX', 60);
    const late = await tokens.rotate(issued.refreshToken);
    expect(late.status).not.toBe('ok');
    expect(await redis.get(`family:${issued.familyId}`)).toBe(
      sha256(issued.refreshToken),
    );
    expect(await redis.exists(`session:${issued.familyId}`)).toBe(1);
    expect(await liveRefreshKeys(redis, issued.familyId)).toEqual([
      `refresh:${sha256(issued.refreshToken)}`,
    ]);

    await tokens.revokeByRefreshToken(issued.refreshToken);
    const afterLogout = await tokens.rotate(issued.refreshToken);
    expect(afterLogout.status).not.toBe('ok');
    expect(await tokens.sessionExists(issued.familyId)).toBe(false);
    expect(await redis.exists(`family:${issued.familyId}`)).toBe(0);
    expect(await liveRefreshKeys(redis, issued.familyId)).toEqual([]);
  });

  it('lets exactly one of two concurrent rotations win, then logout kills the family', async () => {
    const issued = await tokens.createSession(randomUUID());
    const [left, right] = await Promise.all([
      tokens.rotate(issued.refreshToken),
      tokens.rotate(issued.refreshToken),
    ]);
    const results = [left, right];
    expect(results.filter(isOk)).toHaveLength(1);
    for (const result of results) {
      expect(
        result.status === 'ok' ||
          result.status === 'reused' ||
          result.status === 'invalid',
      ).toBe(true);
    }
    const loser = results.find((result) => result.status !== 'ok');
    expect(loser?.status === 'reused' || loser?.status === 'invalid').toBe(
      true,
    );

    await tokens.revokeByRefreshToken(issued.refreshToken);
    const winner = results.find(isOk);
    if (winner) {
      expect((await tokens.rotate(winner.refreshToken)).status).not.toBe('ok');
    }
    expect((await tokens.rotate(issued.refreshToken)).status).not.toBe('ok');
    expect(await tokens.sessionExists(issued.familyId)).toBe(false);
    expect(await liveRefreshKeys(redis, issued.familyId)).toEqual([]);
  });
});

function isOk(
  result: RotateResult,
): result is Extract<RotateResult, { status: 'ok' }> {
  return result.status === 'ok';
}

async function liveRefreshKeys(
  redis: Redis,
  familyId: string,
): Promise<string[]> {
  const found: string[] = [];
  let cursor = '0';
  do {
    const [next, keys] = await redis.scan(
      cursor,
      'MATCH',
      'refresh:*',
      'COUNT',
      200,
    );
    cursor = next;
    for (const key of keys) {
      const raw = await redis.get(key);
      if (raw?.includes(familyId)) found.push(key);
    }
  } while (cursor !== '0');
  return found.sort();
}
