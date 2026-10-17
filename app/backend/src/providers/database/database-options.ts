import type { NamingStrategyInterface } from 'typeorm';
import { SnakeNamingStrategy } from './snake-naming.strategy.js';

export type DatabaseConnectionInput = {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  nodeEnv: 'local' | 'test' | 'production';
};

export type DatabaseConnectionOptions = {
  type: 'postgres';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize: false;
  migrationsRun: false;
  namingStrategy: NamingStrategyInterface;
  ssl: false | { rejectUnauthorized: false };
};

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
