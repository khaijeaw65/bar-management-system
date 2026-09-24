import { DataSource } from 'typeorm';
import { buildDatabaseOptions } from '../config/database.config.js';
import { getEnv } from '../config/env.schema.js';
import { InitExtensions1758662400000 } from './migrations/1758662400000-InitExtensions.js';

export const AppDataSource = new DataSource({
  ...buildDatabaseOptions(getEnv()),
  entities: [],
  migrations: [InitExtensions1758662400000],
});
