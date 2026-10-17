import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { CurrentUserPayload } from '../../../common/decorators/current-user.types.js';
import { JwtConfigService } from '../../../providers/config/jwt/config.service.js';
import { RedisService } from '../../../providers/redis/redis.service.js';
import {
  REVOKE_FAMILY,
  ROTATE_REFRESH,
  familyKey,
  refreshKey,
  sessionKey,
} from './token.scripts.js';
import type {
  AccessClaims,
  IssuedSession,
  RefreshRecord,
  RotateResult,
  RotationOutcome,
} from './token.types.js';

@Injectable()
export class TokenService {
  public constructor(
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly jwtConfig: JwtConfigService,
  ) {}

  public async createSession(userId: string): Promise<IssuedSession> {
    const familyId = randomUUID();
    const refreshToken = this.newRefreshToken();
    const record = { userId, familyId };
    await this.storeRefresh(refreshToken, record);
    await this.storeSession(familyId, userId);
    const accessToken = await this.signAccess(userId, familyId);
    return { accessToken, refreshToken, familyId };
  }

  public async rotate(rawRefresh: string): Promise<RotateResult> {
    const refreshToken = this.newRefreshToken();
    const rawOutcome = await this.evalRotation(rawRefresh, refreshToken);
    return this.rotationResult(rawRefresh, refreshToken, rawOutcome);
  }

  public async revokeByRefreshToken(
    rawRefresh: string | undefined,
  ): Promise<void> {
    if (!rawRefresh) return;
    await this.revokeFamily(rawRefresh);
  }

  public async sessionExists(familyId: string): Promise<boolean> {
    const value = await this.redisService.client.get(sessionKey(familyId));
    return value !== null;
  }

  public async authenticateClaims(
    payload: AccessClaims,
  ): Promise<CurrentUserPayload | null> {
    const claims = this.parseAccessClaims(payload);
    if (!claims) return null;
    const active = await this.sessionExists(claims.sid);
    if (!active) return null;
    return claims;
  }

  public async authenticateAccessToken(
    token: string,
  ): Promise<CurrentUserPayload | null> {
    const payload = await this.readVerifiedPayload(token);
    if (!payload) return null;
    return this.authenticateClaims(payload);
  }

  private async storeRefresh(
    rawRefresh: string,
    record: RefreshRecord,
  ): Promise<void> {
    const hash = this.sha256(rawRefresh);
    const refreshTtlSeconds = this.jwtConfig.refreshTtlSeconds;
    await this.redisService.client.set(
      refreshKey(hash),
      JSON.stringify(record),
      'EX',
      refreshTtlSeconds,
    );
    await this.redisService.client.set(
      familyKey(record.familyId),
      hash,
      'EX',
      refreshTtlSeconds,
    );
  }

  private async storeSession(familyId: string, userId: string): Promise<void> {
    await this.redisService.client.set(
      sessionKey(familyId),
      JSON.stringify({ userId }),
      'EX',
      this.jwtConfig.refreshTtlSeconds,
    );
  }

  private signAccess(userId: string, familyId: string): Promise<string> {
    return this.jwtService.signAsync({ sub: userId, sid: familyId });
  }

  private evalRotation(
    rawRefresh: string,
    refreshToken: string,
  ): Promise<unknown> {
    return this.evalScript(ROTATE_REFRESH, [
      this.sha256(rawRefresh),
      this.sha256(refreshToken),
      this.refreshTtlArgument(),
    ]);
  }

  private async rotationResult(
    rawRefresh: string,
    refreshToken: string,
    rawOutcome: unknown,
  ): Promise<RotateResult> {
    const outcome = this.parseRotationOutcome(rawOutcome);
    if (outcome.kind === 'reused') return this.reused(rawRefresh);
    if (outcome.kind !== 'ok') return { status: 'invalid' };
    return this.rotated(outcome.userId, outcome.familyId, refreshToken);
  }

  private async reused(rawRefresh: string): Promise<RotateResult> {
    await this.revokeFamily(rawRefresh);
    return { status: 'reused' };
  }

  private async rotated(
    userId: string,
    familyId: string,
    refreshToken: string,
  ): Promise<RotateResult> {
    const accessToken = await this.signAccess(userId, familyId);
    return { status: 'ok', accessToken, refreshToken };
  }

  private revokeFamily(rawRefresh: string): Promise<unknown> {
    return this.evalScript(REVOKE_FAMILY, [
      this.sha256(rawRefresh),
      this.refreshTtlArgument(),
    ]);
  }

  private refreshTtlArgument(): string {
    return String(this.jwtConfig.refreshTtlSeconds);
  }

  private evalScript(script: string, args: string[]): Promise<unknown> {
    return this.redisService.client.eval(script, 0, ...args);
  }

  private async readVerifiedPayload(token: string): Promise<AccessClaims | null> {
    try {
      return await this.jwtService.verifyAsync<AccessClaims>(token);
    } catch {
      return null;
    }
  }

  private newRefreshToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private parseRotationOutcome(result: unknown): RotationOutcome {
    if (!Array.isArray(result)) return { kind: 'invalid' };
    return this.outcomeFrom(result);
  }

  private outcomeFrom(result: unknown[]): RotationOutcome {
    const [status, userId, familyId] = result;
    if (status !== 'ok') return this.reusedOrInvalid(status);
    if (typeof userId !== 'string' || typeof familyId !== 'string') {
      return { kind: 'invalid' };
    }
    return { kind: 'ok', userId, familyId };
  }

  private reusedOrInvalid(status: unknown): RotationOutcome {
    if (status === 'reused') return { kind: 'reused' };
    return { kind: 'invalid' };
  }

  private parseAccessClaims(payload: AccessClaims): CurrentUserPayload | null {
    if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string') {
      return null;
    }
    return { sub: payload.sub, sid: payload.sid };
  }
}
