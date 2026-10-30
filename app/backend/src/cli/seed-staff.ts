import { AppDataSource } from '../providers/database/data-source.js';
import { redisIamBump } from './iam-version-bump.js';
import { seedStaffMember } from './seed-iam.js';

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  const value = process.argv[index + 1];
  if (!value || value.startsWith('--')) return undefined;
  return value;
}

const lineUserId = arg('--line-user-id');
const name = arg('--name');
const group = arg('--group') ?? 'เจ้าของ';
if (!lineUserId || !name) {
  console.error('usage: seed:staff -- --line-user-id <sub> --name "<display name>" [--group เจ้าของ|ผู้จัดการ|พนักงาน]');
  process.exit(1);
}

await AppDataSource.initialize();
const redis = redisIamBump();
try {
  const id = await seedStaffMember(AppDataSource, { lineUserId, name, group }, redis.bump);
  console.log(`${name} (${id}) is in ${group}`);
} finally {
  await redis.close();
  await AppDataSource.destroy();
}
