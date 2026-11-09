import axios, { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import { apiClient, ApiError, onAuthExpired, getApiBaseUrl } from '../../../lib/api/client';
import * as tokenStorage from '../../../lib/auth/token-storage';

function makeAxiosError(
  status: number,
  data: unknown,
  config: InternalAxiosRequestConfig,
): AxiosError {
  const response: AxiosResponse = {
    status,
    statusText: status === 401 ? 'Unauthorized' : 'Error',
    headers: {},
    config,
    data,
  };
  return new AxiosError('Request failed', String(status), config, undefined, response);
}

describe('API Client (AC-5, AC-6)', () => {
  beforeEach(async () => {
    jest.restoreAllMocks();
    await tokenStorage.clearTokens();
  });

  it('unwraps envelope data on 2xx responses', async () => {
    apiClient.defaults.adapter = async (config) => ({
      data: { status: 'success', code: 'OK', message: 'Success', data: { id: 'staff-1', name: 'Beam' } },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    const result = await apiClient.get('/test');
    expect(result).toEqual({ id: 'staff-1', name: 'Beam' });
  });

  it('throws ApiError with status, code, and message on non-2xx', async () => {
    apiClient.defaults.adapter = async (config) => {
      throw makeAxiosError(
        400,
        { status: 'error', code: 'INVALID_INPUT', message: 'Bad params' },
        config,
      );
    };

    await expect(apiClient.get('/test')).rejects.toThrow(ApiError);
    try {
      await apiClient.get('/test');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(ApiError);
      if (err instanceof ApiError) {
        expect(err.status).toBe(400);
        expect(err.code).toBe('INVALID_INPUT');
        expect(err.message).toBe('Bad params');
      }
    }
  });

  it('shares single refresh call across 3 parallel 401 requests and retries once (AC-5)', async () => {
    await tokenStorage.saveTokens({
      accessToken: 'expired-access-token',
      refreshToken: 'valid-refresh-token',
    });

    let refreshCallCount = 0;
    jest.spyOn(axios, 'post').mockImplementation(async (url: string) => {
      if (url.includes('/auth/mobile/refresh')) {
        refreshCallCount++;
        return {
          data: {
            status: 'success',
            data: {
              accessToken: 'new-access-token',
              refreshToken: 'new-refresh-token',
              expiresIn: 3600,
            },
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: { headers: new AxiosHeaders() } as InternalAxiosRequestConfig,
        };
      }
      throw new Error(`Unexpected POST to ${url}`);
    });

    apiClient.defaults.adapter = async (config) => {
      const authHeader = config.headers?.Authorization;

      if (authHeader === 'Bearer expired-access-token') {
        throw makeAxiosError(401, { code: 'UNAUTHORIZED', message: 'Token expired' }, config);
      }

      if (authHeader === 'Bearer new-access-token') {
        return {
          data: { status: 'success', data: { url: config.url, success: true } },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      }

      throw new Error(`Unexpected auth header: ${String(authHeader)}`);
    };

    const [res1, res2, res3] = await Promise.all([
      apiClient.get('/orders'),
      apiClient.get('/tickets'),
      apiClient.get('/auth/me'),
    ]);

    expect(res1).toEqual({ url: '/orders', success: true });
    expect(res2).toEqual({ url: '/tickets', success: true });
    expect(res3).toEqual({ url: '/auth/me', success: true });

    expect(refreshCallCount).toBe(1);

    const updatedTokens = await tokenStorage.readTokens();
    expect(updatedTokens).toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });
  });

  it('clears tokens and notifies expiry when refresh fails with 401 (AC-6)', async () => {
    await tokenStorage.saveTokens({
      accessToken: 'expired-access-token',
      refreshToken: 'revoked-refresh-token',
    });

    let authExpiredCalled = false;
    const unsubscribe = onAuthExpired(() => {
      authExpiredCalled = true;
    });

    jest.spyOn(axios, 'post').mockImplementation(async () => {
      const emptyConfig = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
      throw makeAxiosError(
        401,
        { code: 'REFRESH_REVOKED', message: 'Account deactivated or expired' },
        emptyConfig,
      );
    });

    apiClient.defaults.adapter = async (config) => {
      throw makeAxiosError(401, { code: 'UNAUTHORIZED', message: 'Token expired' }, config);
    };

    await expect(apiClient.get('/orders')).rejects.toThrow(ApiError);

    expect(await tokenStorage.readTokens()).toBeNull();
    expect(authExpiredCalled).toBe(true);

    unsubscribe();
  });

  it('throws configuration error when EXPO_PUBLIC_API_URL is missing and mocks are disabled (#5)', () => {
    const origMocks = process.env.EXPO_PUBLIC_USE_MOCKS;
    const origUrl = process.env.EXPO_PUBLIC_API_URL;
    try {
      process.env.EXPO_PUBLIC_USE_MOCKS = '0';
      delete process.env.EXPO_PUBLIC_API_URL;
      expect(() => getApiBaseUrl()).toThrow('EXPO_PUBLIC_API_URL environment variable is required');
    } finally {
      process.env.EXPO_PUBLIC_USE_MOCKS = origMocks;
      process.env.EXPO_PUBLIC_API_URL = origUrl;
    }
  });
});
