import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const DatabaseEnvSchema = z.object({
  PGHOST: z.string().min(1),
  PGPORT: z.coerce.number().int().positive(),
  PGUSER: z.string().min(1),
  PGPASSWORD: z.string().min(1),
  PGDATABASE: z.string().min(1),
});

function parseDatabaseEnv(source: Record<string, unknown>) {
  const result = DatabaseEnvSchema.safeParse({
    PGHOST: source.PGHOST,
    PGPORT: source.PGPORT,
    PGUSER: source.PGUSER,
    PGPASSWORD: source.PGPASSWORD,
    PGDATABASE: source.PGDATABASE,
  });
  if (!result.success) {
    throw new Error(
      `Validate database config error: ${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}

export const databaseConfiguration = registerAs('database', () => {
  const env = parseDatabaseEnv(process.env);
  return {
    host: env.PGHOST,
    port: env.PGPORT,
    username: env.PGUSER,
    password: env.PGPASSWORD,
    database: env.PGDATABASE,
  };
});

export default databaseConfiguration;
