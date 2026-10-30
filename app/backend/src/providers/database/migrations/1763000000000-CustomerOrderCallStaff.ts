import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * BRIEF-048 (DR-028): who placed an order, and the "call staff" bell.
 * `order_record.guest_session_id` NULL = a staff order. The bell lives on the seat, not the visit,
 * so a guest at a free table (no visit yet) can still ring it.
 */
export class CustomerOrderCallStaff1763000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE order_record ADD COLUMN guest_session_id UUID REFERENCES guest_session(id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_order_guest_session ON order_record(guest_session_id) WHERE guest_session_id IS NOT NULL`,
    );
    await queryRunner.query(`
      ALTER TABLE table_seat
        ADD COLUMN staff_called_at   TIMESTAMPTZ,
        ADD COLUMN staff_call_reason VARCHAR(10) CHECK (staff_call_reason IN ('bill', 'other')),
        ADD COLUMN staff_call_note   VARCHAR(100)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE table_seat
        DROP COLUMN staff_call_note,
        DROP COLUMN staff_call_reason,
        DROP COLUMN staff_called_at
    `);
    await queryRunner.query(`DROP INDEX idx_order_guest_session`);
    await queryRunner.query(`ALTER TABLE order_record DROP COLUMN guest_session_id`);
  }
}
