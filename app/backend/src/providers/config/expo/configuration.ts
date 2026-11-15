import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const ExpoEnvSchema = z.object({
  EXPO_ACCESS_TOKEN: z.string().optional(),
});

function parseExpoEnv(source: Record<string, unknown>) {
  const result = ExpoEnvSchema.safeParse({
    EXPO_ACCESS_TOKEN: source.EXPO_ACCESS_TOKEN,
  });
  if (!result.success) {
    throw new Error(`Validate expo config error: ${z.prettifyError(result.error)}`);
  }
  return result.data;
}

export const expoConfiguration = registerAs('expo', () => {
  const env = parseExpoEnv(process.env);
  return { accessToken: env.EXPO_ACCESS_TOKEN || undefined };
});

export default expoConfiguration;
