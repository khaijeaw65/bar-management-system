import { registerAs } from '@nestjs/config';
import { SnakeNamingStrategy } from '../common/database/snake-naming.strategy.js';
import { getEnv, type Env } from './env.schema.js';

export function buildDatabaseOptions(env: Env) {
  return {
    type: 'postgres' as const,
    host: env.PGHOST,
    port: env.PGPORT,
    username: env.PGUSER,
    password: env.PGPASSWORD,
    database: env.PGDATABASE,
    synchronize: false as const,
    migrationsRun: false as const,
    namingStrategy: new SnakeNamingStrategy(),
    ssl:
      env.NODE_ENV === 'local' || env.NODE_ENV === 'test'
        ? (false as const)
        : { rejectUnauthorized: false as const },
  };
}

export const databaseConfig = registerAs('database', () =>
  buildDatabaseOptions(getEnv()),
);
