import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * identity_provider, staff_user, staff_user_identity, and staff_access_request
 * from docs/schema.sql. pos_pin_hash is created here; the PIN feature is a
 * later brief. The schema's venue / table_seat / visit foreign keys to
 * staff_user are created with those tables.
 */
export class StaffIdentity1760659200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE identity_provider AS ENUM ('line', 'phone_otp')`,
    );
    await queryRunner.query(`
      CREATE TABLE staff_user (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        display_name  VARCHAR(200) NOT NULL,
        is_active     BOOLEAN NOT NULL DEFAULT TRUE,
        pos_pin_hash  VARCHAR(100),
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE staff_user_identity (
        id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id      UUID NOT NULL REFERENCES staff_user(id),
        provider     identity_provider NOT NULL,
        external_id  VARCHAR(300),
        display_name VARCHAR(200),
        avatar_url   VARCHAR(500),
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (provider, external_id)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE staff_access_request (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        provider      identity_provider NOT NULL,
        external_id   VARCHAR(300) NOT NULL,
        display_name  VARCHAR(200),
        avatar_url    VARCHAR(500),
        status        VARCHAR(20) NOT NULL DEFAULT 'pending',
        requested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        decided_at    TIMESTAMPTZ,
        decided_by    UUID REFERENCES staff_user(id),
        UNIQUE (provider, external_id)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE staff_access_request');
    await queryRunner.query('DROP TABLE staff_user_identity');
    await queryRunner.query('DROP TABLE staff_user');
    await queryRunner.query('DROP TYPE identity_provider');
  }
}
