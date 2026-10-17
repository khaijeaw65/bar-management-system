import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtConfigService } from '../../../providers/config/jwt/config.service.js';
import { RedisService } from '../../../providers/redis/redis.service.js';

interface RefreshRecord {
  userId: string;
  familyId: string;
}

export type IssuedSession = {
  accessToken: string;
  refreshToken: string;
  familyId: string;
};

export type RotateResult =
  | { status: 'ok'; accessToken: string; refreshToken: string }
  | { status: 'invalid' }
  | { status: 'reused' };

@Injectable()
export class TokenService {
  constructor(
    private readonly redis: RedisService,
    private readonly jwt: JwtService,
    private readonly jwtConfig: JwtConfigService,
  ) {}

  async createSession(userId: string): Promise<IssuedSession> {
    const familyId = randomUUID();
    const refreshToken = newRefreshToken();
    await this.storeRefresh(refreshToken, { userId, familyId });
    await this.storeSession(familyId, userId);
    const accessToken = await this.signAccess(userId, familyId);
    return { accessToken, refreshToken, familyId };
  }

  async rotate(rawRefresh: string): Promise<RotateResult> {
    const hash = sha256(rawRefresh);
    const current = readRecord<RefreshRecord>(
      await this.redis.client.get(refreshKey(hash)),
    );
    if (!current) {
      const used = readRecord<{ familyId: string }>(
        await this.redis.client.get(usedKey(hash)),
      );
      if (!used?.familyId) return { status: 'invalid' };
      await this.revokeFamily(used.familyId);
      return { status: 'reused' };
    }
    await this.redis.client.del(refreshKey(hash));
    await this.redis.client.set(
      usedKey(hash),
      JSON.stringify({ familyId: current.familyId }),
      'EX',
      this.ttl(),
    );
    const refreshToken = newRefreshToken();
    await this.storeRefresh(refreshToken, current);
    await this.storeSession(current.familyId, current.userId);
    const accessToken = await this.signAccess(current.userId, current.familyId);
    return { status: 'ok', accessToken, refreshToken };
  }

  async revokeByRefreshToken(rawRefresh: string | undefined): Promise<void> {
    if (!rawRefresh) return;
    const hash = sha256(rawRefresh);
    const current = readRecord<RefreshRecord>(
      await this.redis.client.get(refreshKey(hash)),
    );
    if (current) {
      await this.revokeFamily(current.familyId);
      return;
    }
    const used = readRecord<{ familyId: string }>(
      await this.redis.client.get(usedKey(hash)),
    );
    if (used?.familyId) {
      await this.revokeFamily(used.familyId);
    }
  }

  async revokeFamily(familyId: string): Promise<void> {
    const currentHash = await this.redis.client.get(familyKey(familyId));
    if (currentHash) {
      await this.redis.client.del(refreshKey(currentHash));
    }
    await this.redis.client.del(sessionKey(familyId), familyKey(familyId));
  }

  async sessionExists(familyId: string): Promise<boolean> {
    const value = await this.redis.client.get(sessionKey(familyId));
    return value !== null;
  }

  private async storeRefresh(rawRefresh: string, record: RefreshRecord): Promise<void> {
    const hash = sha256(rawRefresh);
    const ttl = this.ttl();
    await this.redis.client.set(
      refreshKey(hash),
      JSON.stringify(record),
      'EX',
      ttl,
    );
    await this.redis.client.set(familyKey(record.familyId), hash, 'EX', ttl);
  }

  private async storeSession(familyId: string, userId: string): Promise<void> {
    await this.redis.client.set(
      sessionKey(familyId),
      JSON.stringify({ userId }),
      'EX',
      this.ttl(),
    );
  }

  private signAccess(userId: string, familyId: string): Promise<string> {
    return this.jwt.signAsync({ sub: userId, sid: familyId });
  }

  private ttl(): number {
    return this.jwtConfig.refreshTtlSeconds;
  }
}

function newRefreshToken(): string {
  return randomBytes(32).toString('base64url');
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function refreshKey(hash: string): string {
  return `refresh:${hash}`;
}

function usedKey(hash: string): string {
  return `refresh-used:${hash}`;
}

function sessionKey(familyId: string): string {
  return `session:${familyId}`;
}

function familyKey(familyId: string): string {
  return `family:${familyId}`;
}

function readRecord<T extends object>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed as T;
  } catch {
    return null;
  }
}
