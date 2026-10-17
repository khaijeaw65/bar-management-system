import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const RedisEnvSchema = z.object({
  REDIS_URL: z.string().min(1),
});

function parseRedisEnv(source: Record<string, unknown>) {
  const result = RedisEnvSchema.safeParse({
    REDIS_URL: source.REDIS_URL,
  });
  if (!result.success) {
    throw new Error(
      `Validate redis config error: ${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}

export const redisConfiguration = registerAs('redis', () => {
  const env = parseRedisEnv(process.env);
  return { url: env.REDIS_URL };
});

export default redisConfiguration;
