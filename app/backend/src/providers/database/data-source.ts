import { DataSource } from 'typeorm';
import { appConfiguration } from '../config/app/configuration.js';
import { databaseConfiguration } from '../config/database/configuration.js';
import { databaseOptions } from './database-options.js';
import { migrations } from './migrations.js';

const app = appConfiguration();
const database = databaseConfiguration();

export const AppDataSource = new DataSource({
  ...databaseOptions({
    host: database.host,
    port: database.port,
    username: database.username,
    password: database.password,
    database: database.database,
    nodeEnv: app.nodeEnv,
  }),
  migrations,
});
