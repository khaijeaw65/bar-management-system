import {
  AuthMeSchema,
  MobileTokenResponseSchema,
  type AuthMe,
  type MobileTokenResponse,
} from '@bar/contracts';
import { z } from 'zod';
import { apiClient } from './client';

const LogoutResponseSchema = z.object({
  ok: z.boolean(),
});

export async function exchangeCode(code: string, codeVerifier: string): Promise<MobileTokenResponse> {
  const data = await apiClient.post('/auth/mobile/token', { code, codeVerifier });
  return MobileTokenResponseSchema.parse(data);
}

export async function refreshTokens(refreshToken: string): Promise<MobileTokenResponse> {
  const data = await apiClient.post('/auth/mobile/refresh', { refreshToken });
  return MobileTokenResponseSchema.parse(data);
}

export async function logout(refreshToken?: string): Promise<{ ok: boolean }> {
  const data = await apiClient.post('/auth/logout', refreshToken ? { refreshToken } : {});
  return LogoutResponseSchema.parse(data);
}

export async function getMe(): Promise<AuthMe> {
  const data = await apiClient.get('/auth/me');
  return AuthMeSchema.parse(data);
}
