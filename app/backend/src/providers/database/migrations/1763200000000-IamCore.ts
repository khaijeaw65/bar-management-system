import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * BRIEF-053 (IAM I1): the Staff IAM tables from docs/schema.sql §3, plus the permission catalog,
 * three default policies and groups. No people — memberships come from seed:staff / seed:roster.
 * Ids are fixed so later briefs and the seed CLIs find the default rows by id, not by Thai name.
 */
export class IamCore1763200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const sql of CREATE_TABLES) await queryRunner.query(sql);
    for (const table of ['staff_group', 'policy']) {
      await queryRunner.query(
        `CREATE TRIGGER trg_${table}_updated_at BEFORE UPDATE ON ${table}
         FOR EACH ROW EXECUTE FUNCTION set_updated_at()`,
      );
    }
    await this.seedCatalog(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of DROP_ORDER) await queryRunner.query(`DROP TABLE ${table}`);
  }

  private async seedCatalog(queryRunner: QueryRunner): Promise<void> {
    for (const code of CODES) {
      const [resource, action] = code.split(':');
      await queryRunner.query(`INSERT INTO permission (resource, action) VALUES ($1, $2)`, [resource, action]);
    }
    for (const row of DEFAULTS) {
      await queryRunner.query(`INSERT INTO policy (id, name, description) VALUES ($1, $2, $3)`, [
        row.policyId,
        row.policy,
        row.description,
      ]);
      await queryRunner.query(`INSERT INTO staff_group (id, name, description) VALUES ($1, $2, $3)`, [
        row.groupId,
        row.group,
        row.description,
      ]);
      await queryRunner.query(`INSERT INTO group_policy (group_id, policy_id) VALUES ($1, $2)`, [
        row.groupId,
        row.policyId,
      ]);
      for (const code of row.codes) {
        const [resource, action] = code.split(':');
        await queryRunner.query(
          `INSERT INTO policy_permission (policy_id, permission_id)
           SELECT $1, id FROM permission WHERE resource = $2 AND action = $3`,
          [row.policyId, resource, action],
        );
      }
    }
  }
}

const CODES = [
  'menu:read',
  'menu:write',
  'menu:toggle_availability',
  'orders:read',
  'orders:create',
  'orders:update_status',
  'payments:read',
  'payments:create',
  'payments:mark_paid',
  'reports:read',
  'tables:read',
  'tables:manage',
  'visits:read',
  'visits:open',
  'visits:close',
  'venue:read',
  'venue:update',
  'venue:read_payment',
  'venue:update_payment',
  'staff:manage',
];

const STAFF_CODES = [
  'menu:read',
  'menu:toggle_availability',
  'orders:read',
  'orders:create',
  'orders:update_status',
  'tables:read',
  'visits:read',
  'visits:open',
  'visits:close',
  'payments:read',
  'payments:create',
  'venue:read',
];

const DEFAULTS = [
  {
    policyId: '00000000-0000-4000-8000-0000000a0001',
    groupId: '00000000-0000-4000-8000-0000000b0001',
    policy: 'ทั้งหมด',
    group: 'เจ้าของ',
    description: 'ทุกสิทธิ์',
    codes: CODES,
  },
  {
    policyId: '00000000-0000-4000-8000-0000000a0002',
    groupId: '00000000-0000-4000-8000-0000000b0002',
    policy: 'จัดการร้าน',
    group: 'ผู้จัดการ',
    description: 'ทุกสิทธิ์ ยกเว้นจัดการพนักงานและเปลี่ยนบัญชีรับเงิน',
    codes: CODES.filter((code) => code !== 'staff:manage' && code !== 'venue:update_payment'),
  },
  {
    policyId: '00000000-0000-4000-8000-0000000a0003',
    groupId: '00000000-0000-4000-8000-0000000b0003',
    policy: 'งานพนักงาน',
    group: 'พนักงาน',
    description: 'งานหน้าร้าน ไม่รวมการยืนยันชำระเงินเอง',
    codes: STAFF_CODES,
  },
];

const CREATE_TABLES = [
  `CREATE TABLE staff_group (
     id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     name        VARCHAR(100) NOT NULL,
     description TEXT,
     created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     created_by  UUID REFERENCES staff_user(id),
     updated_by  UUID REFERENCES staff_user(id)
   )`,
  `CREATE TABLE user_group_membership (
     id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id     UUID NOT NULL REFERENCES staff_user(id),
     group_id    UUID NOT NULL REFERENCES staff_group(id),
     valid_from  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     valid_until TIMESTAMPTZ,
     UNIQUE (user_id, group_id)
   )`,
  `CREATE TABLE policy (
     id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     name        VARCHAR(100) NOT NULL,
     description TEXT,
     created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     created_by  UUID REFERENCES staff_user(id),
     updated_by  UUID REFERENCES staff_user(id)
   )`,
  `CREATE TABLE permission (
     id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     resource VARCHAR(100) NOT NULL,
     action   VARCHAR(100) NOT NULL,
     UNIQUE (resource, action)
   )`,
  `CREATE TABLE policy_permission (
     policy_id     UUID NOT NULL REFERENCES policy(id),
     permission_id UUID NOT NULL REFERENCES permission(id),
     PRIMARY KEY (policy_id, permission_id)
   )`,
  `CREATE TABLE group_policy (
     group_id  UUID NOT NULL REFERENCES staff_group(id),
     policy_id UUID NOT NULL REFERENCES policy(id),
     PRIMARY KEY (group_id, policy_id)
   )`,
  `CREATE TABLE user_policy (
     user_id   UUID NOT NULL REFERENCES staff_user(id),
     policy_id UUID NOT NULL REFERENCES policy(id),
     PRIMARY KEY (user_id, policy_id)
   )`,
  `CREATE INDEX idx_membership_user  ON user_group_membership(user_id)`,
  `CREATE INDEX idx_membership_group ON user_group_membership(group_id)`,
  `CREATE INDEX idx_membership_valid ON user_group_membership(valid_until) WHERE valid_until IS NOT NULL`,
];

const DROP_ORDER = [
  'user_policy',
  'group_policy',
  'policy_permission',
  'permission',
  'policy',
  'user_group_membership',
  'staff_group',
];
