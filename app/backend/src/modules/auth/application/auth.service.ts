import { randomBytes } from 'node:crypto';
import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthMe } from '@bar/contracts';
import { AccessRequestService } from '../../iam/application/access-request.service.js';
import { StaffUserService } from '../../iam/application/staff-user.service.js';
import { AppConfigService } from '../../../providers/config/app/config.service.js';
import { RedisService } from '../../../providers/redis/redis.service.js';
import {
  LINE_CLIENT,
  type LineClient,
  type LineProfile,
} from '../domain/line-client.js';
import { TokenService } from './token.service.js';

const OAUTH_TTL_SECONDS = 600;

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

export type LineLoginCallbackInput = {
  code?: string;
  state?: string;
  error?: string;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  public constructor(
    @Inject(LINE_CLIENT) private readonly lineClient: LineClient,
    private readonly redis: RedisService,
    private readonly tokenService: TokenService,
    private readonly staffUserService: StaffUserService,
    private readonly accessRequests: AccessRequestService,
    private readonly appConfig: AppConfigService,
  ) {}

  public async startLineLogin(): Promise<string> {
    const state = randomBytes(32).toString('base64url');
    const nonce = randomBytes(32).toString('base64url');
    await this.redis.client.set(
      oauthKey(state),
      JSON.stringify({ nonce }),
      'EX',
      OAUTH_TTL_SECONDS,
    );
    return this.lineClient.authorizeUrl({ state, nonce });
  }

  public async handleLineCallback(
    input: LineLoginCallbackInput,
  ): Promise<LoginResult> {
    // Single use even on failure: a replayed OAuth state must not mint a session.
    const nonce = input.state ? await this.consumeNonce(input.state) : null;
    if (input.error || !input.code || !nonce)
      return this.createLoginFailedRedirect();
    const profile = await this.verifyLineProfile(input.code, nonce);
    if (!profile) return this.createLoginFailedRedirect();
    return this.completeStaffLogin(profile);
  }

  public async refresh(rawRefresh: string | undefined): Promise<RefreshResult> {
    if (!rawRefresh) return { kind: 'unauthorized' };
    const rotated = await this.tokenService.rotate(rawRefresh);
    if (rotated.status !== 'ok') return { kind: 'unauthorized' };
    return {
      kind: 'ok',
      accessToken: rotated.accessToken,
      refreshToken: rotated.refreshToken,
    };
  }

  public async logout(rawRefresh: string | undefined): Promise<void> {
    await this.tokenService.revokeByRefreshToken(rawRefresh);
  }

  public async getCurrentStaffUser(userId: string): Promise<AuthMe> {
    const user = await this.staffUserService.findActiveById(userId);
    if (!user) throw new UnauthorizedException();
    return {
      id: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    };
  }

  private async consumeNonce(state: string): Promise<string | null> {
    const raw = await this.redis.client.getdel(oauthKey(state));
    return nonceFrom(raw);
  }

  private createLoginFailedRedirect(): LoginResult {
    return {
      kind: 'redirect',
      location: `${this.frontendBaseUrl()}/login?error=login_failed`,
    };
  }

  private async verifyLineProfile(
    code: string,
    nonce: string,
  ): Promise<LineProfile | null> {
    try {
      const exchanged = await this.lineClient.exchangeCode(code);
      return await this.lineClient.verifyIdToken(exchanged.idToken, nonce);
    } catch {
      this.logger.warn('LINE login failed');
      return null;
    }
  }

  private async completeStaffLogin(profile: LineProfile): Promise<LoginResult> {
    const user = await this.staffUserService.findByIdentity(
      'line',
      profile.sub,
    );
    if (!user) return this.handleUnregisteredIdentity(profile);
    if (!user.isActive) return this.rejectInactiveStaff(profile);
    return this.createStaffLoginSession(user.id);
  }

  private async handleUnregisteredIdentity(
    profile: LineProfile,
  ): Promise<LoginResult> {
    await this.accessRequests.recordRequest(
      'line',
      profile.sub,
      profile.name,
      profile.picture,
    );
    this.logger.log(`LINE login not registered sub=${profile.sub}`);
    return this.createNotRegisteredRedirect();
  }

  private rejectInactiveStaff(profile: LineProfile): LoginResult {
    this.logger.log(`LINE login inactive sub=${profile.sub}`);
    return this.createNotRegisteredRedirect();
  }

  private async createStaffLoginSession(userId: string): Promise<LoginResult> {
    const session = await this.tokenService.createSession(userId);
    return {
      kind: 'session',
      location: `${this.frontendBaseUrl()}/`,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    };
  }

  private createNotRegisteredRedirect(): LoginResult {
    return {
      kind: 'redirect',
      location: `${this.frontendBaseUrl()}/login?error=not_registered`,
    };
  }

  private frontendBaseUrl(): string {
    return this.appConfig.frontendUrl.replace(/\/$/, '');
  }
}

function oauthKey(state: string): string {
  return `oauth:${state}`;
}

function nonceFrom(raw: string | null): string | null {
  if (!raw) return null;
  try {
    return readNonce(JSON.parse(raw));
  } catch {
    return null;
  }
}

function readNonce(parsed: unknown): string | null {
  if (typeof parsed !== 'object' || parsed === null || !('nonce' in parsed))
    return null;
  const nonce = (parsed as { nonce: unknown }).nonce;
  if (typeof nonce !== 'string' || nonce.length === 0) return null;
  return nonce;
}
