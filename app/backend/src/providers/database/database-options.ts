import { SnakeNamingStrategy } from './snake-naming.strategy.js';

export function databaseOptions(input: {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  nodeEnv: 'local' | 'test' | 'production';
}) {
  return {
    type: 'postgres' as const,
    host: input.host,
    port: input.port,
    username: input.username,
    password: input.password,
    database: input.database,
    synchronize: false as const,
    migrationsRun: false as const,
    namingStrategy: new SnakeNamingStrategy(),
    ssl:
      input.nodeEnv === 'local' || input.nodeEnv === 'test'
        ? (false as const)
        : { rejectUnauthorized: false as const },
  };
}
