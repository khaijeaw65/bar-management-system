import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service.js';
import type { LineClient } from '../domain/ports/line-client.port.js';
import type { RedisService } from '../../../providers/redis/redis.service.js';
import type { TokenService } from './token.service.js';
import type { StaffUserService } from '../../iam/application/staff-user.service.js';
import type { AccessRequestService } from '../../iam/application/access-request.service.js';
import type { AppConfigService } from '../../../providers/config/app/config.service.js';
import type { IamVersion } from '../../iam/application/iam-version.service.js';
import type { DemoUserService } from './demo-user.service.js';

describe('AuthService.demoLogin', () => {
  let authService: AuthService;
  let lineClient: LineClient;
  let redisService: RedisService;
  let tokenService: TokenService;
  let staffUserService: StaffUserService;
  let accessRequestService: AccessRequestService;
  let appConfigService: AppConfigService;
  let iamVersion: IamVersion;
  let demoUserService: DemoUserService;
  let bumpMock: ReturnType<typeof vi.fn>;
  let createSessionMock: ReturnType<typeof vi.fn>;
  let findOrProvisionMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    lineClient = {} as LineClient;
    redisService = {} as RedisService;
    createSessionMock = vi.fn().mockResolvedValue({
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
    });
    tokenService = {
      createSession: createSessionMock,
    } as unknown as TokenService;
    staffUserService = {} as StaffUserService;
    accessRequestService = {} as AccessRequestService;
    appConfigService = {
      frontendUrl: 'http://localhost:3000',
    } as AppConfigService;
    bumpMock = vi.fn().mockResolvedValue(undefined);
    iamVersion = {
      bump: bumpMock,
    } as unknown as IamVersion;
    findOrProvisionMock = vi.fn().mockResolvedValue('demo-user-id');
    demoUserService = {
      findOrProvision: findOrProvisionMock,
    } as unknown as DemoUserService;

    authService = new AuthService(
      lineClient,
      redisService,
      tokenService,
      staffUserService,
      accessRequestService,
      appConfigService,
      iamVersion,
      demoUserService,
    );
  });

  it('delegates to demoUserService, bumps IAM version, and creates session', async () => {
    const result = await authService.demoLogin('owner');

    expect(result).toEqual({
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
    });
    expect(findOrProvisionMock).toHaveBeenCalledWith('owner');
    expect(bumpMock).toHaveBeenCalledTimes(1);
    expect(createSessionMock).toHaveBeenCalledWith('demo-user-id');
  });
});
