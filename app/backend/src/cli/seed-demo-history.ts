import { DataSource } from 'typeorm';
import { appConfiguration } from '../providers/config/app/configuration.js';
import { AppDataSource } from '../providers/database/data-source.js';
import { assertDemoSeedAllowed, demoHistoryEntities, seedDemoHistory } from './demo-history.js';

assertDemoSeedAllowed(appConfiguration().nodeEnv);

const dataSource = new DataSource({ ...AppDataSource.options, entities: demoHistoryEntities });
await dataSource.initialize();
try {
  const result = await seedDemoHistory(dataSource, new Date());
  console.log(`demo history seeded: ${result.days} days, ${result.visits} bills, ${result.payments} payments`);
} finally {
  await dataSource.destroy();
}
