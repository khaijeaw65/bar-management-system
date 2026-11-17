import axios, { create, isAxiosError, type AxiosRequestConfig } from 'axios';
import { MobileTokenResponseSchema } from '@bar/contracts';
import { readTokens, saveTokens, clearTokens } from '../auth/token-storage';

export class ApiError extends Error {
  public constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

type AuthExpiredListener = () => void;
const authExpiredListeners = new Set<AuthExpiredListener>();

export function onAuthExpired(listener: AuthExpiredListener): () => void {
  authExpiredListeners.add(listener);
  return () => {
    authExpiredListeners.delete(listener);
  };
}

export function notifyAuthExpired(): void {
  authExpiredListeners.forEach((fn) => {
    fn();
  });
}

export function getApiBaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url) {
    if (process.env.EXPO_PUBLIC_USE_MOCKS === '1') {
      return '';
    }
    throw new Error('EXPO_PUBLIC_API_URL environment variable is required when mocks are disabled');
  }
  return url;
}

export const apiClient = create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const tokens = await readTokens();
  if (tokens?.accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

apiClient.interceptors.response.use(
  (response) => {
    const payload = response.data;
    if (payload && typeof payload === 'object' && 'data' in payload) {
      return payload.data;
    }
    return payload;
  },
  async (error) => {
    const originalRequest = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            const tokens = await readTokens();
            if (!tokens?.refreshToken) {
              await clearTokens();
              notifyAuthExpired();
              throw new ApiError(401, 'UNAUTHORIZED', 'No refresh token available');
            }

            const response = await axios.post(
              `${apiClient.defaults.baseURL}/auth/mobile/refresh`,
              { refreshToken: tokens.refreshToken },
              { headers: { 'Content-Type': 'application/json' } }
            );

            const body = response.data;
            const data = body && typeof body === 'object' && 'data' in body ? body.data : body;
            const validated = MobileTokenResponseSchema.parse(data);

            await saveTokens({
              accessToken: validated.accessToken,
              refreshToken: validated.refreshToken,
            });

            return validated.accessToken;
          } catch (refreshErr) {
            if (isAxiosError(refreshErr)) {
              const status = refreshErr.response?.status;
              if (status === 401) {
                await clearTokens();
                notifyAuthExpired();
                throw new ApiError(401, 'UNAUTHORIZED', 'Session expired, please sign in again');
              }
              const errData = refreshErr.response?.data as { code?: string; message?: string } | undefined;
              const code = errData?.code ?? (status ? 'API_ERROR' : 'NETWORK_ERROR');
              const message = errData?.message ?? refreshErr.message ?? 'Refresh request failed';
              throw new ApiError(status ?? 0, code, message);
            }
            if (refreshErr instanceof ApiError && refreshErr.status === 401) {
              await clearTokens();
              notifyAuthExpired();
            }
            throw refreshErr;
          } finally {
            refreshPromise = null;
          }
        })();
      }

      const newAccessToken = await refreshPromise;
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return await apiClient.request(originalRequest);
    }

    if (isAxiosError(error)) {
      const status = error.response?.status ?? 0;
      const errData = error.response?.data as { code?: string; message?: string } | undefined;
      const code = errData?.code ?? (status === 0 ? 'NETWORK_ERROR' : status === 401 ? 'UNAUTHORIZED' : 'API_ERROR');
      const message = errData?.message ?? error.message ?? 'Request failed';
      return Promise.reject(new ApiError(status, code, message));
    }

    if (error instanceof ApiError) {
      return Promise.reject(error);
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    return Promise.reject(new ApiError(500, 'API_ERROR', message));
  }
);
