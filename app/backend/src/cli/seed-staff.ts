import { AppDataSource } from '../providers/database/data-source.js';

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  const value = process.argv[index + 1];
  if (!value || value.startsWith('--')) return undefined;
  return value;
}

const lineUserId = arg('--line-user-id');
const name = arg('--name');
if (!lineUserId || !name) {
  console.error(
    'usage: seed:staff -- --line-user-id <sub> --name "<display name>"',
  );
  process.exit(1);
}

await AppDataSource.initialize();
try {
  const existing: unknown[] = await AppDataSource.query(
    `SELECT 1 FROM staff_user_identity WHERE provider = 'line' AND external_id = $1`,
    [lineUserId],
  );
  if (existing.length > 0) {
    console.log('already registered');
  } else {
    await AppDataSource.transaction(async (manager) => {
      const inserted: Array<{ id: string }> = await manager.query(
        `INSERT INTO staff_user (display_name) VALUES ($1) RETURNING id`,
        [name],
      );
      const id = inserted[0]?.id;
      if (!id) throw new Error('seed:staff did not return a user id');
      await manager.query(
        `INSERT INTO staff_user_identity (user_id, provider, external_id, display_name)
         VALUES ($1, 'line', $2, $3)`,
        [id, lineUserId, name],
      );
      console.log(`registered ${id}`);
    });
  }
} finally {
  await AppDataSource.destroy();
}
