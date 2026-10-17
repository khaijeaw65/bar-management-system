import { z } from 'zod';

export const AuthOkSchema = z.object({ ok: z.literal(true) });

export type AuthOkResponse = z.infer<typeof AuthOkSchema>;

export type RedirectTarget = { url: string; statusCode: number };

export type SessionCookies = {
  nodeEnv: string;
  accessTtlSeconds: number;
  refreshTtlSeconds: number;
  accessToken: string;
  refreshToken: string;
};
