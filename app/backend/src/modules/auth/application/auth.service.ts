import { randomBytes } from 'node:crypto';
import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import type { AuthMe } from '@bar/contracts';
import { AccessRequestService } from '../../iam/application/access-request.service.js';
import { StaffUserService } from '../../iam/application/staff-user.service.js';
import { AppConfigService } from '../../../providers/config/app/config.service.js';
import { RedisService } from '../../../providers/redis/redis.service.js';
import { LINE_CLIENT, type LineClient } from '../domain/line-client.js';
import { TokenService } from './token.service.js';

const OAUTH_TTL_SECONDS = 600;
const LOGIN_FAILED = '/login?error=login_failed';

export type LoginResult =
  | {
      kind: 'session';
      location: string;
      accessToken: string;
      refreshToken: string;
    }
  | { kind: 'redirect'; location: string };

export type RefreshResult =
  | { kind: 'ok'; accessToken: string; refreshToken: string }
  | { kind: 'unauthorized' };

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(LINE_CLIENT) private readonly line: LineClient,
    private readonly redis: RedisService,
    private readonly tokens: TokenService,
    private readonly staff: StaffUserService,
    private readonly accessRequests: AccessRequestService,
    private readonly appConfig: AppConfigService,
  ) {}

  async startLineLogin(): Promise<string> {
    const state = randomBytes(32).toString('base64url');
    const nonce = randomBytes(32).toString('base64url');
    await this.redis.client.set(
      oauthKey(state),
      JSON.stringify({ nonce }),
      'EX',
      OAUTH_TTL_SECONDS,
    );
    return this.line.authorizeUrl({ state, nonce });
  }

  async handleLineCallback(input: {
    code?: string;
    state?: string;
    error?: string;
  }): Promise<LoginResult> {
    if (input.error || !input.code || !input.state) {
      if (input.state) await this.consumeNonce(input.state);
      return { kind: 'redirect', location: LOGIN_FAILED };
    }
    const nonce = await this.consumeNonce(input.state);
    if (!nonce) return { kind: 'redirect', location: LOGIN_FAILED };

    let profile: { sub: string; name: string | null; picture: string | null };
    try {
      const exchanged = await this.line.exchangeCode(input.code);
      profile = await this.line.verifyIdToken(exchanged.idToken, nonce);
    } catch {
      this.logger.warn('LINE login failed');
      return { kind: 'redirect', location: LOGIN_FAILED };
    }

    const user = await this.staff.findByIdentity('line', profile.sub);
    if (user?.isActive) {
      const session = await this.tokens.createSession(user.id);
      return {
        kind: 'session',
        location: `${this.frontendBase()}/`,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      };
    }
    if (user && !user.isActive) {
      this.logger.log(`LINE login inactive sub=${profile.sub}`);
      return {
        kind: 'redirect',
        location: `${this.frontendBase()}/login?error=not_registered`,
      };
    }
    await this.accessRequests.recordRequest(
      'line',
      profile.sub,
      profile.name,
      profile.picture,
    );
    this.logger.log(`LINE login not registered sub=${profile.sub}`);
    return {
      kind: 'redirect',
      location: `${this.frontendBase()}/login?error=not_registered`,
    };
  }

  async refresh(rawRefresh: string | undefined): Promise<RefreshResult> {
    if (!rawRefresh) return { kind: 'unauthorized' };
    const rotated = await this.tokens.rotate(rawRefresh);
    if (rotated.status !== 'ok') return { kind: 'unauthorized' };
    return {
      kind: 'ok',
      accessToken: rotated.accessToken,
      refreshToken: rotated.refreshToken,
    };
  }

  async logout(rawRefresh: string | undefined): Promise<void> {
    await this.tokens.revokeByRefreshToken(rawRefresh);
  }

  async me(userId: string): Promise<AuthMe> {
    const user = await this.staff.findActiveById(userId);
    if (!user) throw new UnauthorizedException();
    return {
      id: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    };
  }

  private async consumeNonce(state: string): Promise<string | null> {
    const raw = await this.redis.client.getdel(oauthKey(state));
    if (!raw) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        !('nonce' in parsed) ||
        typeof parsed.nonce !== 'string' ||
        parsed.nonce.length === 0
      ) {
        return null;
      }
      return parsed.nonce;
    } catch {
      return null;
    }
  }

  private frontendBase(): string {
    return this.appConfig.frontendUrl.replace(/\/$/, '');
  }
}

function oauthKey(state: string): string {
  return `oauth:${state}`;
}
