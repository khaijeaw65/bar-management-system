import type { MigrationInterface, QueryRunner } from 'typeorm';

/** order_record, order_ticket, order_item, order_item_modifier from schema.sql §6. */
export class Orders1762100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE order_status AS ENUM ('pending', 'accepted', 'ready', 'sent', 'issue', 'cancelled')`,
    );
    await queryRunner.query(ORDER_RECORD);
    await queryRunner.query(ORDER_TICKET);
    await queryRunner.query(ORDER_ITEM);
    await queryRunner.query(ISSUE_ITEM_FK);
    await queryRunner.query(ORDER_ITEM_MODIFIER);
    for (const index of INDEXES) await queryRunner.query(index);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE order_ticket DROP CONSTRAINT fk_ticket_issue_item`,
    );
    await queryRunner.query(`DROP TABLE order_item_modifier`);
    await queryRunner.query(`DROP TABLE order_item`);
    await queryRunner.query(`DROP TABLE order_ticket`);
    await queryRunner.query(`DROP TABLE order_record`);
    await queryRunner.query(`DROP TYPE order_status`);
  }
}

const ORDER_RECORD = `
  CREATE TABLE order_record (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id       UUID NOT NULL REFERENCES visit(id),
    order_number   INT  NOT NULL,
    business_date  DATE NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by     UUID REFERENCES staff_user(id),
    updated_by     UUID REFERENCES staff_user(id),
    CONSTRAINT uq_order_number_per_day UNIQUE (business_date, order_number)
  )
`;

const ORDER_TICKET = `
  CREATE TABLE order_ticket (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id            UUID NOT NULL REFERENCES order_record(id),
    station             kitchen_station,
    status              order_status NOT NULL DEFAULT 'pending',
    issue_reason        VARCHAR(30),
    issue_item_id       UUID,
    issue_note          TEXT,
    issue_reported_by   UUID REFERENCES staff_user(id),
    issue_escalated_at  TIMESTAMPTZ,
    sent_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by          UUID REFERENCES staff_user(id),
    updated_by          UUID REFERENCES staff_user(id),
    CONSTRAINT uq_ticket_station_per_order UNIQUE NULLS NOT DISTINCT (order_id, station)
  )
`;

const ORDER_ITEM = `
  CREATE TABLE order_item (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id             UUID NOT NULL REFERENCES order_ticket(id),
    menu_item_variant_id  UUID NOT NULL REFERENCES menu_item_variant(id),
    quantity              SMALLINT NOT NULL DEFAULT 1,
    unit_price_snapshot   NUMERIC(10,2) NOT NULL,
    ordered_by_name       VARCHAR(100),
    notes                 TEXT,
    cancelled_at          TIMESTAMPTZ,
    cancelled_by          UUID REFERENCES staff_user(id),
    cancel_reason         VARCHAR(50),
    cancel_note           TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by            UUID REFERENCES staff_user(id),
    updated_by            UUID REFERENCES staff_user(id)
  )
`;

const ISSUE_ITEM_FK = `
  ALTER TABLE order_ticket ADD CONSTRAINT fk_ticket_issue_item
    FOREIGN KEY (issue_item_id) REFERENCES order_item(id)
`;

const ORDER_ITEM_MODIFIER = `
  CREATE TABLE order_item_modifier (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_item_id        UUID NOT NULL REFERENCES order_item(id),
    modifier_option_id   UUID NOT NULL REFERENCES modifier_option(id),
    price_delta_snapshot NUMERIC(10,2) NOT NULL
  )
`;

const INDEXES = [
  `CREATE INDEX idx_order_visit ON order_record(visit_id)`,
  `CREATE INDEX idx_ticket_order ON order_ticket(order_id)`,
  `CREATE INDEX idx_ticket_status ON order_ticket(status)`,
  `CREATE INDEX idx_order_item_ticket ON order_item(ticket_id)`,
];
