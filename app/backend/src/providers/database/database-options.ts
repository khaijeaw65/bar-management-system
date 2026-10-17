import { SnakeNamingStrategy } from './snake-naming.strategy.js';
import type {
  DatabaseConnectionInput,
  DatabaseConnectionOptions,
} from './database-options.types.js';

export function databaseOptions(
  input: DatabaseConnectionInput,
): DatabaseConnectionOptions {
  return {
    type: 'postgres',
    host: input.host,
    port: input.port,
    username: input.username,
    password: input.password,
    database: input.database,
    synchronize: false,
    migrationsRun: false,
    namingStrategy: new SnakeNamingStrategy(),
    ssl: postgresSsl(input.nodeEnv),
  };
}

function postgresSsl(
  nodeEnv: DatabaseConnectionInput['nodeEnv'],
): DatabaseConnectionOptions['ssl'] {
  if (nodeEnv === 'local' || nodeEnv === 'test') return false;
  return { rejectUnauthorized: false };
}
