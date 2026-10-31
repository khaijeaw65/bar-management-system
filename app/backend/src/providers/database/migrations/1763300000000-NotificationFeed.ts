import type { MigrationInterface, QueryRunner } from 'typeorm';

export class NotificationFeed1763300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE notification_type AS ENUM (
        'table_idle', 'table_opened', 'restock_request', 'low_stock',
        'payment_confirmed', 'order_new', 'food_ready', 'call_staff'
      );
    `);

    await queryRunner.query(`
      CREATE TABLE notification (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        recipient_id  UUID NOT NULL REFERENCES staff_user(id),
        type          notification_type NOT NULL,
        title         VARCHAR(200) NOT NULL,
        body          VARCHAR(500),
        ref_type      VARCHAR(50),
        ref_id        UUID,
        read_at       TIMESTAMPTZ,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_notification_feed ON notification(recipient_id, created_at DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_notification_unread ON notification(recipient_id) WHERE read_at IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE notification;`);
    await queryRunner.query(`DROP TYPE notification_type;`);
  }
}
