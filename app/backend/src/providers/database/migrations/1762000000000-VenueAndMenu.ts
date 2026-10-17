import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * venue and the menu tables from docs/schema.sql §1 and §4.
 * Enums item_type, kitchen_station, venue_payment_mode, promptpay_id_type
 * are created here because no earlier migration owns them.
 */
export class VenueAndMenu1762000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE item_type AS ENUM ('simple', 'recipe', 'charge')`,
    );
    await queryRunner.query(
      `CREATE TYPE kitchen_station AS ENUM ('bar', 'food')`,
    );
    await queryRunner.query(
      `CREATE TYPE venue_payment_mode AS ENUM ('own_promptpay', 'gateway')`,
    );
    await queryRunner.query(
      `CREATE TYPE promptpay_id_type AS ENUM ('mobile', 'national_id', 'ewallet')`,
    );
    await queryRunner.query(`
      CREATE TABLE venue (
        id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name                     VARCHAR(200) NOT NULL,
        slug                     VARCHAR(100) NOT NULL UNIQUE,
        kitchen_display_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
        business_day_cutoff      TIME NOT NULL DEFAULT '06:00',
        payment_mode             venue_payment_mode NOT NULL DEFAULT 'own_promptpay',
        promptpay_id             VARCHAR(20),
        promptpay_id_type        promptpay_id_type,
        counter_qr_enabled       BOOLEAN NOT NULL DEFAULT FALSE,
        shift_close_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
        created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by               UUID,
        updated_by               UUID
      )
    `);
    await queryRunner.query(
      `ALTER TABLE venue ADD CONSTRAINT venue_created_by_fk FOREIGN KEY (created_by) REFERENCES staff_user(id)`,
    );
    await queryRunner.query(
      `ALTER TABLE venue ADD CONSTRAINT venue_updated_by_fk FOREIGN KEY (updated_by) REFERENCES staff_user(id)`,
    );
    await queryRunner.query(`
      CREATE TABLE menu_category (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name        VARCHAR(200) NOT NULL,
        sort_order  SMALLINT NOT NULL DEFAULT 0,
        is_active   BOOLEAN NOT NULL DEFAULT TRUE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by  UUID REFERENCES staff_user(id),
        updated_by  UUID REFERENCES staff_user(id)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE menu_item (
        id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        category_id  UUID NOT NULL REFERENCES menu_category(id),
        name         VARCHAR(200) NOT NULL,
        description  TEXT,
        image_key    VARCHAR(500),
        base_price   NUMERIC(10,2) NOT NULL DEFAULT 0,
        item_type    item_type NOT NULL DEFAULT 'simple',
        kitchen_tag  kitchen_station,
        is_available BOOLEAN NOT NULL DEFAULT TRUE,
        is_promo     BOOLEAN NOT NULL DEFAULT FALSE,
        sort_order   SMALLINT NOT NULL DEFAULT 0,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by   UUID REFERENCES staff_user(id),
        updated_by   UUID REFERENCES staff_user(id),
        CONSTRAINT chk_menu_item_station CHECK ((item_type = 'charge') = (kitchen_tag IS NULL))
      )
    `);
    await queryRunner.query(`
      CREATE TABLE menu_item_availability (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        menu_item_id  UUID NOT NULL REFERENCES menu_item(id) ON DELETE CASCADE,
        days_of_week  SMALLINT[] NOT NULL,
        start_time    TIME NOT NULL,
        end_time      TIME NOT NULL,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by    UUID REFERENCES staff_user(id),
        updated_by    UUID REFERENCES staff_user(id),
        CONSTRAINT chk_avail_time CHECK (start_time <> end_time),
        CONSTRAINT chk_avail_days CHECK (days_of_week <@ ARRAY[1,2,3,4,5,6,7]::SMALLINT[]
                                         AND cardinality(days_of_week) > 0)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_menu_item_avail_item ON menu_item_availability(menu_item_id)`,
    );
    await queryRunner.query(`
      CREATE TABLE menu_item_variant (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        menu_item_id  UUID NOT NULL REFERENCES menu_item(id),
        name          VARCHAR(200) NOT NULL,
        price         NUMERIC(10,2) NOT NULL,
        is_available  BOOLEAN NOT NULL DEFAULT TRUE,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by    UUID REFERENCES staff_user(id),
        updated_by    UUID REFERENCES staff_user(id)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE modifier_group (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name        VARCHAR(200) NOT NULL,
        is_required BOOLEAN NOT NULL DEFAULT FALSE,
        min_select  SMALLINT NOT NULL DEFAULT 0,
        max_select  SMALLINT NOT NULL DEFAULT 1,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by  UUID REFERENCES staff_user(id),
        updated_by  UUID REFERENCES staff_user(id)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE modifier_option (
        id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        group_id     UUID NOT NULL REFERENCES modifier_group(id),
        name         VARCHAR(200) NOT NULL,
        price_delta  NUMERIC(10,2) NOT NULL DEFAULT 0,
        is_available BOOLEAN NOT NULL DEFAULT TRUE,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE menu_variant_modifier_group (
        menu_item_variant_id  UUID NOT NULL REFERENCES menu_item_variant(id),
        modifier_group_id     UUID NOT NULL REFERENCES modifier_group(id),
        PRIMARY KEY (menu_item_variant_id, modifier_group_id)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE menu_variant_modifier_group');
    await queryRunner.query('DROP TABLE modifier_option');
    await queryRunner.query('DROP TABLE modifier_group');
    await queryRunner.query('DROP TABLE menu_item_variant');
    await queryRunner.query('DROP TABLE menu_item_availability');
    await queryRunner.query('DROP TABLE menu_item');
    await queryRunner.query('DROP TABLE menu_category');
    await queryRunner.query('DROP TABLE venue');
    await queryRunner.query('DROP TYPE item_type');
    await queryRunner.query('DROP TYPE kitchen_station');
    await queryRunner.query('DROP TYPE venue_payment_mode');
    await queryRunner.query('DROP TYPE promptpay_id_type');
  }
}
