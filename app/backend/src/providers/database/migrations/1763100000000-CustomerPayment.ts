import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * BRIEF-052: pay the table bill from the phone.
 * `payment.guest_session_id` NULL = a staff-created payment; set = the phone that created it (only that phone may cancel).
 * The seat bell gains the reason `transfer` ("แจ้งโอนแล้ว").
 */
export class CustomerPayment1763100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE payment ADD COLUMN guest_session_id UUID REFERENCES guest_session(id)`);
    await queryRunner.query(
      `CREATE INDEX idx_payment_guest_session ON payment(guest_session_id) WHERE guest_session_id IS NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE table_seat DROP CONSTRAINT table_seat_staff_call_reason_check`);
    await queryRunner.query(`
      ALTER TABLE table_seat
        ADD CONSTRAINT table_seat_staff_call_reason_check
        CHECK (staff_call_reason IN ('bill', 'other', 'transfer'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE table_seat SET staff_call_reason = 'other' WHERE staff_call_reason = 'transfer'`);
    await queryRunner.query(`ALTER TABLE table_seat DROP CONSTRAINT table_seat_staff_call_reason_check`);
    await queryRunner.query(`
      ALTER TABLE table_seat
        ADD CONSTRAINT table_seat_staff_call_reason_check
        CHECK (staff_call_reason IN ('bill', 'other'))
    `);
    await queryRunner.query(`DROP INDEX idx_payment_guest_session`);
    await queryRunner.query(`ALTER TABLE payment DROP COLUMN guest_session_id`);
  }
}
