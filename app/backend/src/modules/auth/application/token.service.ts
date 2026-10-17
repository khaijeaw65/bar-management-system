import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtConfigService } from '../../../providers/config/jwt/config.service.js';
import { RedisService } from '../../../providers/redis/redis.service.js';
import type {
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
    const refreshToken = newRefreshToken();
    const record = { userId, familyId };
    await this.storeRefresh(refreshToken, record);
    await this.storeSession(familyId, userId);
    const accessToken = await this.signAccess(userId, familyId);
    return { accessToken, refreshToken, familyId };
  }

  public async rotate(rawRefresh: string): Promise<RotateResult> {
    const refreshToken = newRefreshToken();
    const outcome = parseRotationOutcome(
      await this.evalScript(ROTATE_REFRESH, [
        sha256(rawRefresh),
        sha256(refreshToken),
        String(this.jwtConfig.refreshTtlSeconds),
      ]),
    );
    if (outcome.kind === 'reused') {
      await this.evalScript(REVOKE_FAMILY, [
        sha256(rawRefresh),
        this.revokedTtlSeconds(),
      ]);
      return { status: 'reused' };
    }
    if (outcome.kind !== 'ok') return { status: 'invalid' };
    const accessToken = await this.signAccess(outcome.userId, outcome.familyId);
    return { status: 'ok', accessToken, refreshToken };
  }

  public async revokeByRefreshToken(
    rawRefresh: string | undefined,
  ): Promise<void> {
    if (!rawRefresh) return;
    await this.evalScript(REVOKE_FAMILY, [
      sha256(rawRefresh),
      this.revokedTtlSeconds(),
    ]);
  }

  public async sessionExists(familyId: string): Promise<boolean> {
    const value = await this.redisService.client.get(sessionKey(familyId));
    return value !== null;
  }

  private async storeRefresh(
    rawRefresh: string,
    record: RefreshRecord,
  ): Promise<void> {
    const hash = sha256(rawRefresh);
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

  private revokedTtlSeconds(): string {
    return String(this.jwtConfig.refreshTtlSeconds);
  }

  private evalScript(script: string, args: string[]): Promise<unknown> {
    return this.redisService.client.eval(script, 0, ...args);
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

function sessionKey(familyId: string): string {
  return `session:${familyId}`;
}

function familyKey(familyId: string): string {
  return `family:${familyId}`;
}

function parseRotationOutcome(result: unknown): RotationOutcome {
  if (!Array.isArray(result)) return { kind: 'invalid' };
  const [status, userId, familyId] = result;
  if (
    status === 'ok' &&
    typeof userId === 'string' &&
    typeof familyId === 'string'
  ) {
    return { kind: 'ok', userId, familyId };
  }
  if (status === 'reused') return { kind: 'reused' };
  return { kind: 'invalid' };
}

// One EVAL: consume the live token and publish its replacement together.
// A revoked family publishes nothing, so logout cannot lose the race.
const ROTATE_REFRESH = `
local function decode(raw)
  if not raw or raw == false then return nil end
  local ok, value = pcall(cjson.decode, raw)
  if not ok or type(value) ~= 'table' then return nil end
  return value
end

local oldHash = ARGV[1]
local newHash = ARGV[2]
local ttl = tonumber(ARGV[3])
local raw = redis.call('GET', 'refresh:' .. oldHash)
local record = decode(raw)
if not record or type(record['userId']) ~= 'string' or type(record['familyId']) ~= 'string' then
  local used = decode(redis.call('GET', 'refresh-used:' .. oldHash))
  if used and type(used['familyId']) == 'string' then
    return {'reused'}
  end
  return {'invalid'}
end

local familyId = record['familyId']
local userId = record['userId']
if redis.call('EXISTS', 'family-revoked:' .. familyId) == 1 then
  return {'invalid'}
end
if redis.call('EXISTS', 'session:' .. familyId) == 0 then
  return {'invalid'}
end

redis.call('SET', 'refresh-used:' .. oldHash, cjson.encode({ familyId = familyId }), 'EX', ttl)
redis.call('DEL', 'refresh:' .. oldHash)
redis.call('SET', 'refresh:' .. newHash, cjson.encode({ userId = userId, familyId = familyId }), 'EX', ttl)
redis.call('SET', 'family:' .. familyId, newHash, 'EX', ttl)
redis.call('SET', 'session:' .. familyId, cjson.encode({ userId = userId }), 'EX', ttl)
return {'ok', userId, familyId}
`;

// One EVAL: resolve the family from the live token or its used marker,
// delete every live token, and leave the family revoked.
const REVOKE_FAMILY = `
local function decode(raw)
  if not raw or raw == false then return nil end
  local ok, value = pcall(cjson.decode, raw)
  if not ok or type(value) ~= 'table' then return nil end
  return value
end

local hash = ARGV[1]
local ttl = tonumber(ARGV[2])
local familyId = nil
local live = decode(redis.call('GET', 'refresh:' .. hash))
if live and type(live['familyId']) == 'string' then
  familyId = live['familyId']
else
  local used = decode(redis.call('GET', 'refresh-used:' .. hash))
  if used and type(used['familyId']) == 'string' then
    familyId = used['familyId']
  end
end
if not familyId then return 0 end

local current = redis.call('GET', 'family:' .. familyId)
if current and current ~= false then
  redis.call('DEL', 'refresh:' .. current)
end
redis.call('DEL', 'refresh:' .. hash)
redis.call('DEL', 'family:' .. familyId, 'session:' .. familyId)
redis.call('SET', 'family-revoked:' .. familyId, '1', 'EX', ttl)
return 1
`;
