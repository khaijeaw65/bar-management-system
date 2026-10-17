import { AppDataSource } from '../providers/database/data-source.js';
import { seedMenu } from './seed-menu-catalog.js';

await AppDataSource.initialize();
try {
  await seedMenu(AppDataSource);
  console.log('menu seeded');
} finally {
  await AppDataSource.destroy();
}
