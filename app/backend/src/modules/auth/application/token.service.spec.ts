import { createHash, randomUUID } from 'node:crypto';
import { Logger } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Redis } from 'ioredis';
import { JwtConfigService } from '../../../providers/config/jwt/config.service.js';
import { RedisService } from '../../../providers/redis/redis.service.js';
import { TokenService, type RotateResult } from './token.service.js';

const SECRET = 'x'.repeat(32);

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

describe('TokenService', () => {
  const store = new Map<string, string>();
  const client = {
    async get(key: string) {
      return store.get(key) ?? null;
    },
    async set(key: string, value: string) {
      store.set(key, value);
      return 'OK' as const;
    },
    async del(...keys: string[]) {
      for (const key of keys) store.delete(key);
      return keys.length;
    },
    async getdel(key: string) {
      const value = store.get(key) ?? null;
      store.delete(key);
      return value;
    },
  };

  let tokens: TokenService;

  beforeEach(async () => {
    store.clear();
    const moduleRef = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: SECRET,
          signOptions: { expiresIn: 900, algorithm: 'HS256' },
        }),
      ],
      providers: [
        TokenService,
        { provide: RedisService, useValue: { client } },
        {
          provide: JwtConfigService,
          useValue: { refreshTtlSeconds: 604_800, accessSecret: SECRET },
        },
      ],
    }).compile();
    tokens = moduleRef.get(TokenService);
  });

  it('rotates a refresh token and revokes the family when the old token is reused', async () => {
    const first = await tokens.createSession('user-1');
    expect(Buffer.from(first.refreshToken, 'base64url')).toHaveLength(32);

    const rotated = await tokens.rotate(first.refreshToken);
    expect(rotated.status).toBe('ok');
    if (rotated.status !== 'ok') return;
    expect(rotated.refreshToken).not.toBe(first.refreshToken);
    expect(store.has(`refresh:${sha256(first.refreshToken)}`)).toBe(false);
    expect(store.has(`refresh:${sha256(rotated.refreshToken)}`)).toBe(true);

    const reused = await tokens.rotate(first.refreshToken);
    expect(reused.status).toBe('reused');
    expect(store.has(`refresh:${sha256(rotated.refreshToken)}`)).toBe(false);
    expect(await tokens.sessionExists(first.familyId)).toBe(false);

    const after = await tokens.rotate(rotated.refreshToken);
    expect(after.status).toBe('invalid');
  });

  it('stores only the hash of a refresh token and does not log the token or secret', async () => {
    const messages: string[] = [];
    const write = (message: unknown) => {
      messages.push(String(message));
    };
    const log = vi.spyOn(Logger.prototype, 'log').mockImplementation(write);
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(write);
    const error = vi.spyOn(Logger.prototype, 'error').mockImplementation(write);

    const issued = await tokens.createSession('user-1');
    const hash = sha256(issued.refreshToken);

    expect(store.has(`refresh:${hash}`)).toBe(true);
    for (const [key, value] of store) {
      expect(key).not.toContain(issued.refreshToken);
      expect(value).not.toContain(issued.refreshToken);
      expect(value).not.toContain(issued.accessToken);
      expect(value).not.toContain(SECRET);
    }
    expect(messages.join('\n')).not.toContain(issued.refreshToken);
    expect(messages.join('\n')).not.toContain(issued.accessToken);
    expect(messages.join('\n')).not.toContain(SECRET);

    log.mockRestore();
    warn.mockRestore();
    error.mockRestore();
  });
});

describe('TokenService concurrent rotation (real Redis)', () => {
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

  async function raceRotate() {
    const issued = await tokens.createSession(randomUUID());
    const [left, right] = await Promise.all([
      tokens.rotate(issued.refreshToken),
      tokens.rotate(issued.refreshToken),
    ]);
    const winners = [left, right].filter(isOk);
    expect(winners).toHaveLength(1);
    const winner = winners[0];
    if (!winner) throw new Error('expected one winning rotation');
    return { issued, winner };
  }

  async function expectFamilyDead(familyId: string, refreshTokens: string[]) {
    for (const refreshToken of refreshTokens) {
      const result = await tokens.rotate(refreshToken);
      expect(result.status).not.toBe('ok');
    }
    expect(await tokens.sessionExists(familyId)).toBe(false);
  }

  it('lets one caller win, and logout with either token keeps the family dead', async () => {
    const byWinner = await raceRotate();
    await tokens.revokeByRefreshToken(byWinner.winner.refreshToken);
    await expectFamilyDead(byWinner.issued.familyId, [
      byWinner.winner.refreshToken,
      byWinner.issued.refreshToken,
    ]);

    const byOriginal = await raceRotate();
    await tokens.revokeByRefreshToken(byOriginal.issued.refreshToken);
    await expectFamilyDead(byOriginal.issued.familyId, [
      byOriginal.winner.refreshToken,
      byOriginal.issued.refreshToken,
    ]);
  });
});

function isOk(result: RotateResult): result is Extract<RotateResult, { status: 'ok' }> {
  return result.status === 'ok';
}
