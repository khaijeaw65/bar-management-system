import { AppDataSource } from '../providers/database/data-source.js';
import { seedVenue } from './seed-venue.js';

await AppDataSource.initialize();
try {
  await seedVenue(AppDataSource);
  console.log('venue seeded');
} finally {
  await AppDataSource.destroy();
}
