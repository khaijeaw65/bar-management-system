import { randomBytes } from 'node:crypto';
import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthMe, MobileTokenRequest } from '@bar/contracts';
import { AccessRequestService } from '../../iam/application/access-request.service.js';
import { StaffUserService } from '../../iam/application/staff-user.service.js';
import { AppConfigService } from '../../../providers/config/app/config.service.js';
import { RedisService } from '../../../providers/redis/redis.service.js';
import { LINE_CLIENT, type LineClient } from '../domain/line-client.js';
import type { LineProfile } from '../domain/line-client.types.js';
import type {
  LineLoginCallbackInput,
  LineLoginStart,
  LoginResult,
  MobileAuthError,
  MobileCodeRecord,
  MobileTokenResult,
  OauthState,
  RefreshResult,
} from './auth.types.js';
import { mobileCodeChallenge } from './mobile-login.js';
import { verifyPkceS256 } from './pkce.js';
import { TokenService } from './token.service.js';

const OAUTH_TTL_SECONDS = 600;
const MOBILE_CODE_TTL_SECONDS = 60;
const MOBILE_APP_REDIRECT = 'barapp://auth';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  public constructor(
    @Inject(LINE_CLIENT) private readonly lineClient: LineClient,
    private readonly redisService: RedisService,
    private readonly tokenService: TokenService,
    private readonly staffUserService: StaffUserService,
    private readonly accessRequestService: AccessRequestService,
    private readonly appConfigService: AppConfigService,
  ) {}

  public async startLineLogin(input: LineLoginStart): Promise<string> {
    const codeChallenge = mobileCodeChallenge(input);
    const state = this.lineState(codeChallenge !== null);
    const nonce = randomBytes(32).toString('base64url');
    await this.storeOauthState(state, this.oauthRecord(nonce, codeChallenge));
    return this.lineClient.authorizeUrl({ state, nonce });
  }

  public async handleLineCallback(
    input: LineLoginCallbackInput,
  ): Promise<LoginResult> {
    const stored = await this.takeOauthState(input.state);
    if (stored?.client === 'mobile') return this.finishMobileLogin(input, stored);
    return this.finishWebLogin(input, stored);
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

  public async exchangeMobileCode(
    input: MobileTokenRequest,
  ): Promise<MobileTokenResult> {
    const stored = await this.takeMobileCode(input.code);
    if (!stored || !verifyPkceS256(input.codeVerifier, stored.codeChallenge)) {
      return { kind: 'unauthorized' };
    }
    return this.issueMobileTokens(stored.userId);
  }

  public async refreshMobile(refreshToken: string): Promise<MobileTokenResult> {
    const rotated = await this.tokenService.rotate(refreshToken);
    if (rotated.status !== 'ok') return { kind: 'unauthorized' };
    return this.mobileTokens(rotated.accessToken, rotated.refreshToken);
  }

  private async finishWebLogin(
    input: LineLoginCallbackInput,
    stored: OauthState | null,
  ): Promise<LoginResult> {
    if (input.error || !input.code || !stored?.nonce) {
      return this.createLoginFailedRedirect();
    }
    const profile = await this.verifyLineProfile(input.code, stored.nonce);
    if (!profile) return this.createLoginFailedRedirect();
    return this.completeStaffLogin(profile);
  }

  private async finishMobileLogin(
    input: LineLoginCallbackInput,
    stored: OauthState,
  ): Promise<LoginResult> {
    if (this.mobileCallbackRejected(input, stored)) return this.mobileLoginFailed();
    const profile = await this.verifyLineProfile(input.code ?? '', stored.nonce);
    if (!profile) return this.mobileLoginFailed();
    return this.completeMobileStaffLogin(profile, stored.codeChallenge ?? '');
  }

  private mobileCallbackRejected(
    input: LineLoginCallbackInput,
    stored: OauthState,
  ): boolean {
    return Boolean(input.error || !input.code || !stored.nonce || !stored.codeChallenge);
  }

  private async completeStaffLogin(profile: LineProfile): Promise<LoginResult> {
    const user = await this.staffUserService.findByIdentity('line', profile.sub);
    if (!user) return this.handleUnregisteredIdentity(profile);
    if (!user.isActive) return this.rejectInactiveStaff(profile);
    return this.createStaffLoginSession(user.id);
  }

  private async completeMobileStaffLogin(
    profile: LineProfile,
    codeChallenge: string,
  ): Promise<LoginResult> {
    const user = await this.staffUserService.findByIdentity('line', profile.sub);
    if (!user) return this.handleMobileUnregistered(profile);
    if (!user.isActive) return this.rejectMobileInactive(profile);
    return this.createMobileHandoff(user.id, codeChallenge);
  }

  private async handleUnregisteredIdentity(
    profile: LineProfile,
  ): Promise<LoginResult> {
    await this.recordUnregistered(profile);
    return this.createNotRegisteredRedirect();
  }

  private async handleMobileUnregistered(
    profile: LineProfile,
  ): Promise<LoginResult> {
    await this.recordUnregistered(profile);
    return this.mobileErrorRedirect('not_registered');
  }

  private async recordUnregistered(profile: LineProfile): Promise<void> {
    await this.accessRequestService.recordRequest({
      provider: 'line',
      externalId: profile.sub,
      displayName: profile.name,
      avatarUrl: profile.picture,
    });
    this.logger.log(`LINE login not registered sub=${profile.sub}`);
  }

  private rejectInactiveStaff(profile: LineProfile): LoginResult {
    this.logInactive(profile);
    return this.createNotRegisteredRedirect();
  }

  private rejectMobileInactive(profile: LineProfile): LoginResult {
    this.logInactive(profile);
    return this.mobileErrorRedirect('not_registered');
  }

  private logInactive(profile: LineProfile): void {
    this.logger.log(`LINE login inactive sub=${profile.sub}`);
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

  private async createMobileHandoff(
    userId: string,
    codeChallenge: string,
  ): Promise<LoginResult> {
    const code = randomBytes(32).toString('base64url');
    await this.storeMobileCode(code, { userId, codeChallenge });
    return this.mobileCodeRedirect(code);
  }

  private async issueMobileTokens(userId: string): Promise<MobileTokenResult> {
    const session = await this.tokenService.createMobileSession(userId);
    return this.mobileTokens(session.accessToken, session.refreshToken);
  }

  private mobileTokens(
    accessToken: string,
    refreshToken: string,
  ): MobileTokenResult {
    return { kind: 'ok', accessToken, refreshToken };
  }

  private async takeOauthState(state: string | undefined): Promise<OauthState | null> {
    if (!state) return null;
    const raw = await this.redisService.client.getdel(this.oauthKey(state));
    return this.parseOauthState(raw) ?? this.missingMobileState(state);
  }

  // No Redis record can succeed. The m. prefix only picks the app's error URL.
  private missingMobileState(state: string): OauthState | null {
    if (!state.startsWith('m.')) return null;
    return { nonce: '', client: 'mobile', codeChallenge: '' };
  }

  private lineState(mobile: boolean): string {
    const token = randomBytes(32).toString('base64url');
    if (!mobile) return token;
    return `m.${token}`;
  }

  private async storeOauthState(state: string, record: OauthState): Promise<void> {
    await this.redisService.client.set(
      this.oauthKey(state),
      JSON.stringify(record),
      'EX',
      OAUTH_TTL_SECONDS,
    );
  }

  private oauthRecord(nonce: string, codeChallenge: string | null): OauthState {
    if (!codeChallenge) return { nonce };
    return { nonce, client: 'mobile', codeChallenge };
  }

  private async storeMobileCode(
    code: string,
    record: MobileCodeRecord,
  ): Promise<void> {
    await this.redisService.client.set(
      this.mauthKey(code),
      JSON.stringify(record),
      'EX',
      MOBILE_CODE_TTL_SECONDS,
    );
  }

  private async takeMobileCode(code: string): Promise<MobileCodeRecord | null> {
    const raw = await this.redisService.client.getdel(this.mauthKey(code));
    return this.parseMobileCode(raw);
  }

  private createLoginFailedRedirect(): LoginResult {
    return {
      kind: 'redirect',
      location: `${this.frontendBaseUrl()}/login?error=login_failed`,
    };
  }

  private createNotRegisteredRedirect(): LoginResult {
    return {
      kind: 'redirect',
      location: `${this.frontendBaseUrl()}/login?error=not_registered`,
    };
  }

  private mobileLoginFailed(): LoginResult {
    return this.mobileErrorRedirect('login_failed');
  }

  private mobileErrorRedirect(error: MobileAuthError): LoginResult {
    return { kind: 'redirect', location: this.mobileLocation('error', error) };
  }

  private mobileCodeRedirect(code: string): LoginResult {
    return { kind: 'redirect', location: this.mobileLocation('code', code) };
  }

  private mobileLocation(key: string, value: string): string {
    const url = new URL(MOBILE_APP_REDIRECT);
    url.searchParams.set(key, value);
    return url.toString();
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

  private frontendBaseUrl(): string {
    return this.appConfigService.frontendUrl.replace(/\/$/, '');
  }

  private oauthKey(state: string): string {
    return `oauth:${state}`;
  }

  private mauthKey(code: string): string {
    return `mauth:${code}`;
  }

  private parseOauthState(raw: string | null): OauthState | null {
    if (!raw) return null;
    try {
      return this.readOauthState(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  private readOauthState(parsed: unknown): OauthState | null {
    if (!this.isRecord(parsed)) return null;
    if (typeof parsed.nonce !== 'string' || parsed.nonce.length === 0) return null;
    if (parsed.client !== 'mobile') return { nonce: parsed.nonce };
    return this.mobileOauthState(parsed.nonce, parsed.codeChallenge);
  }

  private mobileOauthState(nonce: string, codeChallenge: unknown): OauthState {
    if (typeof codeChallenge !== 'string' || codeChallenge.length === 0) {
      return { nonce, client: 'mobile', codeChallenge: '' };
    }
    return { nonce, client: 'mobile', codeChallenge };
  }

  private parseMobileCode(raw: string | null): MobileCodeRecord | null {
    if (!raw) return null;
    try {
      return this.readMobileCode(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  private readMobileCode(parsed: unknown): MobileCodeRecord | null {
    if (!this.isRecord(parsed)) return null;
    if (!this.isMobileCode(parsed)) return null;
    return { userId: parsed.userId, codeChallenge: parsed.codeChallenge };
  }

  private isMobileCode(
    parsed: Record<string, unknown>,
  ): parsed is MobileCodeRecord {
    return (
      typeof parsed.userId === 'string' &&
      parsed.userId.length > 0 &&
      typeof parsed.codeChallenge === 'string' &&
      parsed.codeChallenge.length > 0
    );
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
