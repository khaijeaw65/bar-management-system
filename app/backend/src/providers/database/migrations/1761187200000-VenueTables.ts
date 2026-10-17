import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * table_seat and visit from docs/schema.sql, including BRIEF-011 Q1 and Q3.
 * visit.customer_id is a nullable UUID without the customer FK: the customer
 * table does not exist yet, same deferral BRIEF-007 used for staff FKs.
 */
export class VenueTables1761187200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE table_seat_kind AS ENUM ('table', 'counter')`,
    );
    await queryRunner.query(
      `CREATE TYPE visit_state AS ENUM ('open', 'active', 'idle', 'closed', 'abandoned')`,
    );
    await queryRunner.query(
      `CREATE TYPE visit_open_source AS ENUM ('pos', 'app', 'qr')`,
    );
    await queryRunner.query(`
      CREATE TABLE table_seat (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        label       VARCHAR(50) NOT NULL,
        kind        table_seat_kind NOT NULL DEFAULT 'table',
        sort_order  SMALLINT NOT NULL DEFAULT 0,
        qr_token    VARCHAR(64) UNIQUE,
        is_active   BOOLEAN NOT NULL DEFAULT TRUE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by  UUID,
        updated_by  UUID
      )
    `);
    await queryRunner.query(`
      CREATE TABLE visit (
        id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        table_seat_id  UUID NOT NULL REFERENCES table_seat(id),
        customer_id    UUID,
        state          visit_state NOT NULL DEFAULT 'open',
        guest_label    VARCHAR(100),
        opened_by      UUID,
        opened_via     visit_open_source NOT NULL DEFAULT 'pos',
        opened_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        closed_at      TIMESTAMPTZ,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `ALTER TABLE table_seat ADD CONSTRAINT seat_created_by_fk FOREIGN KEY (created_by) REFERENCES staff_user(id)`,
    );
    await queryRunner.query(
      `ALTER TABLE table_seat ADD CONSTRAINT seat_updated_by_fk FOREIGN KEY (updated_by) REFERENCES staff_user(id)`,
    );
    await queryRunner.query(
      `ALTER TABLE visit ADD CONSTRAINT visit_opened_by_fk FOREIGN KEY (opened_by) REFERENCES staff_user(id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_visit_table_seat ON visit(table_seat_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_visit_customer ON visit(customer_id) WHERE customer_id IS NOT NULL`,
    );
    await queryRunner.query(`CREATE INDEX idx_visit_state ON visit(state)`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX uq_visit_live_per_seat ON visit(table_seat_id) WHERE state IN ('open','active','idle')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE visit');
    await queryRunner.query('DROP TABLE table_seat');
    await queryRunner.query('DROP TYPE visit_open_source');
    await queryRunner.query('DROP TYPE visit_state');
    await queryRunner.query('DROP TYPE table_seat_kind');
  }
}
