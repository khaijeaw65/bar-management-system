import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * BRIEF-018 (DR-016 A):
 * item_adjustment enum ('void', 'comp'), cancel_kind and approved_by on order_item,
 * backfill existing cancelled lines to 'void', CHECK constraint (cancel_kind IS NULL) = (cancelled_at IS NULL),
 * and adds orders:void, orders:comp to catalog and จัดการร้าน policy.
 */
export class OrderItemAdjustment1763600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE item_adjustment AS ENUM ('void', 'comp')`);
    await queryRunner.query(
      `ALTER TABLE order_item
       ADD COLUMN cancel_kind item_adjustment,
       ADD COLUMN approved_by UUID REFERENCES staff_user(id)`,
    );
    await queryRunner.query(
      `UPDATE order_item SET cancel_kind = 'void' WHERE cancelled_at IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE order_item
       ADD CONSTRAINT chk_order_item_adjustment CHECK ((cancel_kind IS NULL) = (cancelled_at IS NULL))`,
    );

    await queryRunner.query(
      `INSERT INTO permission (resource, action) VALUES ('orders', 'void'), ('orders', 'comp')
       ON CONFLICT (resource, action) DO NOTHING`,
    );
    await queryRunner.query(
      `INSERT INTO policy_permission (policy_id, permission_id)
       SELECT p.id, perm.id
       FROM (VALUES
         ('00000000-0000-4000-8000-0000000a0001'::uuid),
         ('00000000-0000-4000-8000-0000000a0002'::uuid)
       ) AS p(id)
       CROSS JOIN permission perm
       WHERE perm.resource = 'orders' AND perm.action IN ('void', 'comp')
       ON CONFLICT (policy_id, permission_id) DO NOTHING`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM policy_permission
       WHERE permission_id IN (
         SELECT id FROM permission WHERE resource = 'orders' AND action IN ('void', 'comp')
       )`,
    );
    await queryRunner.query(
      `DELETE FROM permission WHERE resource = 'orders' AND action IN ('void', 'comp')`,
    );
    await queryRunner.query(`ALTER TABLE order_item DROP CONSTRAINT IF EXISTS chk_order_item_adjustment`);
    await queryRunner.query(`ALTER TABLE order_item DROP COLUMN IF EXISTS approved_by`);
    await queryRunner.query(`ALTER TABLE order_item DROP COLUMN IF EXISTS cancel_kind`);
    await queryRunner.query(`DROP TYPE IF EXISTS item_adjustment`);
  }
}
