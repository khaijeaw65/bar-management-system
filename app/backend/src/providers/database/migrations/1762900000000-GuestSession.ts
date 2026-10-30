import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * DR-028: a guest's QR session. Only the SHA-256 of the cookie token is stored.
 * A seat-only row (visit_id NULL) expires; a row bound to a visit lives as long as the visit.
 * `order_record.guest_session_id` arrives with the order write (BRIEF-048).
 */
export class GuestSession1762900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE guest_session (
        id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        token_hash     CHAR(64) NOT NULL UNIQUE,
        table_seat_id  UUID NOT NULL REFERENCES table_seat(id),
        visit_id       UUID REFERENCES visit(id),
        display_name   VARCHAR(30),
        expires_at     TIMESTAMPTZ NOT NULL,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_guest_session_seat ON guest_session(table_seat_id)`);
    await queryRunner.query(
      `CREATE INDEX idx_guest_session_seat_only_expiry ON guest_session(expires_at) WHERE visit_id IS NULL`,
    );
    await queryRunner.query(`
      CREATE TRIGGER trg_guest_session_updated_at BEFORE UPDATE ON guest_session
      FOR EACH ROW EXECUTE FUNCTION set_updated_at()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE guest_session`);
  }
}
