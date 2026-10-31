import type { MigrationInterface, QueryRunner } from 'typeorm';

export class StaffPushToken1763400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE staff_push_token (
        id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        staff_user_id   UUID NOT NULL REFERENCES staff_user(id) ON DELETE CASCADE,
        expo_push_token VARCHAR(255) NOT NULL UNIQUE,
        platform        VARCHAR(10) NOT NULL CHECK (platform IN ('ios', 'android')),
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX idx_staff_push_token_user ON staff_push_token(staff_user_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE staff_push_token;`);
  }
}
