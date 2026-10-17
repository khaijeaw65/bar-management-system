import type { NamingStrategyInterface } from 'typeorm';

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
