import { AppDataSource } from '../providers/database/data-source.js';
import { redisIamBump } from './iam-version-bump.js';
import { seedRoster } from './seed-iam.js';

await AppDataSource.initialize();
const redis = redisIamBump();
try {
  const roster = await seedRoster(AppDataSource, process.env.DEV_OWNER_LINE_SUBS, redis.bump);
  for (const entry of roster) console.log(`${entry.name} → ${entry.group}`);
  if (!process.env.DEV_OWNER_LINE_SUBS) console.warn('DEV_OWNER_LINE_SUBS is empty — no owner was added');
} finally {
  await redis.close();
  await AppDataSource.destroy();
}
