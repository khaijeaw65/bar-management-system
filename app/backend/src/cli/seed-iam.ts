import type { DataSource } from 'typeorm';
import { GROUP_ID_BY_NAME } from '../modules/iam/domain/default-groups.js';

export interface SeedStaffInput {
  lineUserId: string;
  name: string;
  group: string;
}

export interface RosterEntry {
  lineUserId: string;
  name: string;
  group: string;
}

/** Called after any IAM write so cached permission sets go stale (BRIEF-053 §6). */
export type BumpIamVersion = () => Promise<void>;

const DEMO_ROSTER: RosterEntry[] = [
  { lineUserId: 'U-demo-manager', name: 'Demo ผู้จัดการ', group: 'ผู้จัดการ' },
  { lineUserId: 'U-demo-staff', name: 'Demo พนักงาน', group: 'พนักงาน' },
];

/** Creates or reuses the staff user for this LINE sub and upserts a permanent membership in the group. Returns the user id. */
export async function seedStaffMember(
  dataSource: DataSource,
  input: SeedStaffInput,
  bump: BumpIamVersion,
): Promise<string> {
  const groupId = GROUP_ID_BY_NAME[input.group];
  if (!groupId) throw new Error(`unknown group "${input.group}" — use ${Object.keys(GROUP_ID_BY_NAME).join(' | ')}`);
  const userId = await dataSource.transaction(async (manager) => {
    const id = await findOrCreateUser(manager, input);
    await manager.query(
      `INSERT INTO user_group_membership (user_id, group_id) VALUES ($1, $2)
       ON CONFLICT (user_id, group_id) DO UPDATE SET valid_until = NULL`,
      [id, groupId],
    );
    return id;
  });
  await bump();
  return userId;
}

/** `DEV_OWNER_LINE_SUBS` = comma list `sub:Name`; each becomes an owner. The two demo users are always added. */
export async function seedRoster(
  dataSource: DataSource,
  ownerSubs: string | undefined,
  bump: BumpIamVersion,
): Promise<RosterEntry[]> {
  const roster = [...parseOwners(ownerSubs), ...DEMO_ROSTER];
  for (const entry of roster) await seedStaffMember(dataSource, entry, bump);
  return roster;
}

export function parseOwners(raw: string | undefined): RosterEntry[] {
  return (raw ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((part) => {
      const [lineUserId, ...nameParts] = part.split(':');
      const name = nameParts.join(':').trim();
      return { lineUserId: (lineUserId ?? '').trim(), name: name || (lineUserId ?? '').trim(), group: 'เจ้าของ' };
    });
}

async function findOrCreateUser(
  manager: Pick<DataSource, 'query'>,
  input: SeedStaffInput,
): Promise<string> {
  const existing: Array<{ user_id: string }> = await manager.query(
    `SELECT user_id FROM staff_user_identity WHERE provider = 'line' AND external_id = $1`,
    [input.lineUserId],
  );
  const found = existing[0]?.user_id;
  if (found) return found;
  const inserted: Array<{ id: string }> = await manager.query(
    `INSERT INTO staff_user (display_name) VALUES ($1) RETURNING id`,
    [input.name],
  );
  const id = inserted[0]?.id;
  if (!id) throw new Error('seed did not return a user id');
  await manager.query(
    `INSERT INTO staff_user_identity (user_id, provider, external_id, display_name) VALUES ($1, 'line', $2, $3)`,
    [id, input.lineUserId, input.name],
  );
  return id;
}
