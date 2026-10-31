import { z } from 'zod';
import type { LineLoginStart, MobileCodeRecord, OauthState } from './auth.types.js';

const invalidChallenge = 'รหัสยืนยันไม่ถูกต้อง';

const MobileChallengeSchema = z.object({
  codeChallenge: z
    .string(invalidChallenge)
    .regex(/^[A-Za-z0-9_-]{43}$/, invalidChallenge),
  codeChallengeMethod: z.literal('S256', 'วิธียืนยันไม่ถูกต้อง'),
});

export function mobileCodeChallenge(input: LineLoginStart): string | null {
  if (input.client !== 'mobile') return null;
  return MobileChallengeSchema.parse(input).codeChallenge;
}

export function parseOauthState(raw: string | null): OauthState | null {
  if (!raw) return null;
  try {
    return readOauthState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function parseMobileCode(raw: string | null): MobileCodeRecord | null {
  if (!raw) return null;
  try {
    return readMobileCode(JSON.parse(raw));
  } catch {
    return null;
  }
}

function readOauthState(parsed: unknown): OauthState | null {
  if (!isRecord(parsed)) return null;
  if (typeof parsed.nonce !== 'string' || parsed.nonce.length === 0) return null;
  if (parsed.client !== 'mobile') return { nonce: parsed.nonce };
  const codeChallenge =
    typeof parsed.codeChallenge === 'string' && parsed.codeChallenge.length > 0
      ? parsed.codeChallenge
      : '';
  return { nonce: parsed.nonce, client: 'mobile', codeChallenge };
}

function readMobileCode(parsed: unknown): MobileCodeRecord | null {
  if (!isRecord(parsed) || !isMobileCode(parsed)) return null;
  return { userId: parsed.userId, codeChallenge: parsed.codeChallenge };
}

function isMobileCode(parsed: Record<string, unknown>): parsed is MobileCodeRecord {
  return (
    typeof parsed.userId === 'string' &&
    parsed.userId.length > 0 &&
    typeof parsed.codeChallenge === 'string' &&
    parsed.codeChallenge.length > 0
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
