import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const OpenApiEnvSchema = z.object({
  OPENAPI_ENABLED: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true'),
});

function parseOpenApiEnv(source: Record<string, unknown>) {
  const raw = source.OPENAPI_ENABLED;
  const result = OpenApiEnvSchema.safeParse({
    OPENAPI_ENABLED: raw === undefined || raw === '' ? 'true' : raw,
  });
  if (!result.success) {
    throw new Error(
      `Validate openapi config error: ${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}

export const openApiConfiguration = registerAs('openapi', () => {
  const env = parseOpenApiEnv(process.env);
  return { enabled: env.OPENAPI_ENABLED };
});

export default openApiConfiguration;
