import { z } from 'zod';
import { UuidSchema } from './common.js';

export const AuthMeSchema = z.object({
  id: UuidSchema,
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
});

export type AuthMe = z.infer<typeof AuthMeSchema>;

const invalidCode = 'รหัสไม่ถูกต้อง';
const invalidVerifier = 'รหัสยืนยันไม่ถูกต้อง';
const invalidToken = 'โทเคนไม่ถูกต้อง';

// RFC 7636: 43–128 unreserved characters.
const codeVerifier = z
  .string(invalidVerifier)
  .regex(/^[A-Za-z0-9\-._~]{43,128}$/, invalidVerifier);

export const MobileTokenRequestSchema = z.object({
  code: z.string(invalidCode).min(1, invalidCode),
  codeVerifier,
});

export type MobileTokenRequest = z.infer<typeof MobileTokenRequestSchema>;

export const MobileRefreshRequestSchema = z.object({
  refreshToken: z.string(invalidToken).min(1, invalidToken),
});

export type MobileRefreshRequest = z.infer<typeof MobileRefreshRequestSchema>;

export const MobileTokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number().int().positive(),
});

export type MobileTokenResponse = z.infer<typeof MobileTokenResponseSchema>;

export const DemoLoginRoleSchema = z.enum(['owner', 'manager', 'staff']);
export type DemoLoginRole = z.infer<typeof DemoLoginRoleSchema>;

export const DemoLoginRequestSchema = z.object({
  role: DemoLoginRoleSchema,
});
export type DemoLoginRequest = z.infer<typeof DemoLoginRequestSchema>;
