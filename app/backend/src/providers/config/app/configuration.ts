import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const AppEnvSchema = z.object({
  NODE_ENV: z.enum(['local', 'test', 'production']),
  PORT: z.coerce.number().int().positive(),
});

function parseAppEnv(source: Record<string, unknown>) {
  const result = AppEnvSchema.safeParse({
    NODE_ENV: source.NODE_ENV,
    PORT: source.PORT === undefined || source.PORT === '' ? 3001 : source.PORT,
  });
  if (!result.success) {
    throw new Error(
      `Validate app config error: ${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}

export const appConfiguration = registerAs('app', () => {
  const env = parseAppEnv(process.env);
  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
  };
});

export default appConfiguration;
