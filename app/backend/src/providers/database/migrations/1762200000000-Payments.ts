import type { MigrationInterface, QueryRunner } from 'typeorm';

/** payment, payment_order, payment_charge_item from schema.sql §7. */
export class Payments1762200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE payment_method AS ENUM ('promptpay', 'cash')`);
    await queryRunner.query(
      `CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TYPE payment_confirmed_via AS ENUM ('webhook', 'manual', 'cash', 'slip_verify')`,
    );
    await queryRunner.query(PAYMENT);
    await queryRunner.query(PAYMENT_ORDER);
    await queryRunner.query(PAYMENT_CHARGE_ITEM);
    for (const index of INDEXES) await queryRunner.query(index);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE payment_charge_item`);
    await queryRunner.query(`DROP TABLE payment_order`);
    await queryRunner.query(`DROP TABLE payment`);
    await queryRunner.query(`DROP TYPE payment_confirmed_via`);
    await queryRunner.query(`DROP TYPE payment_status`);
    await queryRunner.query(`DROP TYPE payment_method`);
  }
}

const PAYMENT = `
  CREATE TABLE payment (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id        UUID NOT NULL REFERENCES visit(id),
    amount          NUMERIC(12,2) NOT NULL,
    method          payment_method NOT NULL DEFAULT 'promptpay',
    status          payment_status NOT NULL DEFAULT 'pending',
    gateway_tx_id   VARCHAR(300) UNIQUE,
    qr_payload      TEXT,
    confirmed_via   payment_confirmed_via,
    slip_trans_ref  VARCHAR(100) UNIQUE,
    slip_amount     NUMERIC(12,2),
    paid_at         TIMESTAMPTZ,
    attempt_id      UUID NOT NULL,
    part_no         SMALLINT NOT NULL DEFAULT 1,
    part_count      SMALLINT NOT NULL DEFAULT 1,
    status_reason   VARCHAR(30),
    status_note     TEXT,
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by      UUID REFERENCES staff_user(id),
    updated_by      UUID REFERENCES staff_user(id)
  )
`;

const PAYMENT_ORDER = `
  CREATE TABLE payment_order (
    payment_id  UUID NOT NULL REFERENCES payment(id),
    order_id    UUID NOT NULL REFERENCES order_record(id),
    PRIMARY KEY (payment_id, order_id)
  )
`;

const PAYMENT_CHARGE_ITEM = `
  CREATE TABLE payment_charge_item (
    payment_id     UUID NOT NULL REFERENCES payment(id),
    order_item_id  UUID NOT NULL REFERENCES order_item(id),
    PRIMARY KEY (payment_id, order_item_id)
  )
`;

const INDEXES = [
  `CREATE INDEX idx_payment_visit ON payment(visit_id)`,
  `CREATE INDEX idx_payment_status ON payment(status)`,
  `CREATE INDEX idx_payment_order_pay ON payment_order(payment_id)`,
  `CREATE INDEX idx_payment_order_ord ON payment_order(order_id)`,
  `CREATE INDEX idx_payment_visit_status ON payment(visit_id, status)`,
];
