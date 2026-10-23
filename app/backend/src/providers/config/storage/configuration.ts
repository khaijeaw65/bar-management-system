import { registerAs } from '@nestjs/config';
import { z } from 'zod';

// Access keys are local-dev only; without them the SDK falls back to the ECS task role.
const StorageEnvSchema = z.object({
  AWS_REGION: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1).optional(),
  AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),
});

function blankToUndefined(value: unknown): unknown {
  return value === '' ? undefined : value;
}

function parseStorageEnv(source: Record<string, unknown>) {
  const result = StorageEnvSchema.safeParse({
    AWS_REGION: blankToUndefined(source.AWS_REGION),
    S3_BUCKET: blankToUndefined(source.S3_BUCKET),
    AWS_ACCESS_KEY_ID: blankToUndefined(source.AWS_ACCESS_KEY_ID),
    AWS_SECRET_ACCESS_KEY: blankToUndefined(source.AWS_SECRET_ACCESS_KEY),
  });
  if (!result.success) {
    throw new Error(`Validate storage config error: ${z.prettifyError(result.error)}`);
  }
  return result.data;
}

export const storageConfiguration = registerAs('storage', () => {
  const env = parseStorageEnv(process.env);
  return {
    region: env.AWS_REGION,
    bucket: env.S3_BUCKET,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  };
});

export default storageConfiguration;
