import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['local', 'test', 'production']),
  PORT: z.coerce.number().int().positive(),
  PGHOST: z.string().min(1),
  PGPORT: z.coerce.number().int().positive(),
  PGUSER: z.string().min(1),
  PGPASSWORD: z.string().min(1),
  PGDATABASE: z.string().min(1),
});

export type Env = z.infer<typeof EnvSchema>;

let booted: Env | undefined;

export function parseEnv(source: Record<string, unknown>): Env {
  const result = EnvSchema.safeParse({
    NODE_ENV: source.NODE_ENV,
    PORT: source.PORT === undefined || source.PORT === '' ? 3001 : source.PORT,
    PGHOST: source.PGHOST,
    PGPORT: source.PGPORT,
    PGUSER: source.PGUSER,
    PGPASSWORD: source.PGPASSWORD,
    PGDATABASE: source.PGDATABASE,
  });

  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment: ${detail}`);
  }

  return result.data;
}

/** Nest `ConfigModule` validate hook. Parses once per process. */
export function validateEnv(source: Record<string, unknown>): Env {
  booted = parseEnv(source);
  return booted;
}

export function getEnv(): Env {
  booted ??= parseEnv(process.env);
  return booted;
}
