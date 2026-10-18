import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const UNIT_SECONDS = { s: 1, m: 60, h: 3600, d: 86400 } as const;

const JwtEnvSchema = z.object({
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().regex(/^\d+[smhd]$/),
  REFRESH_TTL_DAYS: z.coerce.number().int().positive(),
  MOBILE_REFRESH_TTL_DAYS: z.coerce.number().int().positive(),
});

function blankToUndefined(value: unknown): unknown {
  return value === undefined || value === '' ? undefined : value;
}

export function durationSeconds(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) {
    throw new Error('Validate jwt config error: JWT_ACCESS_TTL');
  }
  const amount = Number(match[1]);
  const unit = match[2] as keyof typeof UNIT_SECONDS;
  return amount * UNIT_SECONDS[unit];
}

function parseJwtEnv(source: Record<string, unknown>) {
  const result = JwtEnvSchema.safeParse({
    JWT_ACCESS_SECRET: source.JWT_ACCESS_SECRET,
    JWT_ACCESS_TTL: blankToUndefined(source.JWT_ACCESS_TTL) ?? '15m',
    REFRESH_TTL_DAYS: blankToUndefined(source.REFRESH_TTL_DAYS) ?? 7,
    MOBILE_REFRESH_TTL_DAYS:
      blankToUndefined(source.MOBILE_REFRESH_TTL_DAYS) ?? 30,
  });
  if (!result.success) {
    throw new Error(
      `Validate jwt config error: ${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}

export const jwtConfiguration = registerAs('jwt', () => {
  const env = parseJwtEnv(process.env);
  return {
    accessSecret: env.JWT_ACCESS_SECRET,
    accessTtl: env.JWT_ACCESS_TTL,
    accessTtlSeconds: durationSeconds(env.JWT_ACCESS_TTL),
    refreshTtlDays: env.REFRESH_TTL_DAYS,
    refreshTtlSeconds: env.REFRESH_TTL_DAYS * 24 * 60 * 60,
    mobileRefreshTtlDays: env.MOBILE_REFRESH_TTL_DAYS,
    mobileRefreshTtlSeconds: env.MOBILE_REFRESH_TTL_DAYS * 24 * 60 * 60,
  };
});

export default jwtConfiguration;
