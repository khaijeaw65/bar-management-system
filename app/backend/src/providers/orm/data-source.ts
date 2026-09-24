import { DataSource } from 'typeorm';
import { databaseOptions } from '../config/config.service.js';
import { parseEnv } from '../config/config.schema.js';
import { migrations } from './migrations.js';

export const AppDataSource = new DataSource({
  ...databaseOptions(parseEnv(process.env)),
  entities: [],
  migrations,
});
