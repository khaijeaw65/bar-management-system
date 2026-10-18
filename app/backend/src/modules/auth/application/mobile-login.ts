import { z } from 'zod';
import type { LineLoginStart } from './auth.types.js';

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
