/** Fixed ids seeded by the IamCore migration (BRIEF-053). Names are display text; code finds rows by id. */
export const DEFAULT_GROUP_IDS = {
  owner: '00000000-0000-4000-8000-0000000b0001',
  manager: '00000000-0000-4000-8000-0000000b0002',
  staff: '00000000-0000-4000-8000-0000000b0003',
} as const;

export const GROUP_ID_BY_NAME: Record<string, string> = {
  เจ้าของ: DEFAULT_GROUP_IDS.owner,
  ผู้จัดการ: DEFAULT_GROUP_IDS.manager,
  พนักงาน: DEFAULT_GROUP_IDS.staff,
};
