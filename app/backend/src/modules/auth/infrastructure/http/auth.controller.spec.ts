import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { AuthController } from './auth.controller.js';
import type { AuthService } from '../../application/auth.service.js';
import type { AppConfigService } from '../../../../providers/config/app/config.service.js';
import type { JwtConfigService } from '../../../../providers/config/jwt/config.service.js';

describe('AuthController.demoLogin', () => {
  let controller: AuthController;
  let authService: AuthService;
  let appConfig: AppConfigService;
  let jwtConfig: JwtConfigService;
  let demoLoginMock: ReturnType<typeof vi.fn>;
  let resMock: Response;
  let cookieMock: ReturnType<typeof vi.fn>;
  let jsonMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    demoLoginMock = vi.fn().mockResolvedValue({
      accessToken: 'acc-123',
      refreshToken: 'ref-456',
    });
    authService = {
      demoLogin: demoLoginMock,
    } as unknown as AuthService;
    appConfig = {
      nodeEnv: 'development',
    } as unknown as AppConfigService;
    jwtConfig = {
      accessTtlSeconds: 900,
      refreshTtlSeconds: 604800,
    } as JwtConfigService;

    cookieMock = vi.fn();
    jsonMock = vi.fn();
    resMock = {
      cookie: cookieMock,
      json: jsonMock,
    } as unknown as Response;

    controller = new AuthController(authService, appConfig, jwtConfig);
  });

  it('logs in as demo role and writes cookies in non-production', async () => {
    const result = await controller.demoLogin({ role: 'manager' }, resMock);

    expect(result).toEqual({ ok: true });
    expect(demoLoginMock).toHaveBeenCalledWith('manager');
    expect(cookieMock).toHaveBeenCalledWith(
      'access_token',
      'acc-123',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(cookieMock).toHaveBeenCalledWith(
      'refresh_token',
      'ref-456',
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('throws NotFoundException in production environment', async () => {
    (appConfig as { nodeEnv: string }).nodeEnv = 'production';

    await expect(controller.demoLogin({ role: 'owner' }, resMock)).rejects.toThrow(
      NotFoundException,
    );
    expect(demoLoginMock).not.toHaveBeenCalled();
    expect(cookieMock).not.toHaveBeenCalled();
  });

  it('rejects invalid role with validation error', async () => {
    await expect(controller.demoLogin({ role: 'invalid' }, resMock)).rejects.toThrow();
    expect(demoLoginMock).not.toHaveBeenCalled();
  });
});
