import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * DR-023: the database owns `updated_at`. Every UPDATE stamps the row with the database's time, never
 * earlier than the previous stamp + 1 ms (`now()` is the transaction start, so an overlapping
 * transaction that locks the row second would otherwise write an older stamp).
 */
export class UpdatedAtTrigger1762500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(CREATE_FUNCTION);
    for (const sql of CREATE_TRIGGERS) await queryRunner.query(sql);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const sql of DROP_TRIGGERS) await queryRunner.query(sql);
    await queryRunner.query(`DROP FUNCTION set_updated_at()`);
  }
}

/** Every table that has `updated_at` today; a table created later attaches the trigger in its own migration. */
const TABLES = [
  'venue',
  'table_seat',
  'visit',
  'staff_user',
  'menu_category',
  'menu_item',
  'menu_item_availability',
  'menu_item_variant',
  'modifier_group',
  'modifier_option',
  'order_record',
  'order_ticket',
  'order_item',
  'payment',
];

const CREATE_TRIGGERS = TABLES.map(
  (table) =>
    `CREATE TRIGGER trg_${table}_updated_at BEFORE UPDATE ON ${table}
     FOR EACH ROW EXECUTE FUNCTION set_updated_at()`,
);

const DROP_TRIGGERS = TABLES.map((table) => `DROP TRIGGER trg_${table}_updated_at ON ${table}`);

const CREATE_FUNCTION = `
  CREATE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
  BEGIN
    NEW.updated_at := GREATEST(now(), OLD.updated_at + interval '1 millisecond');
    RETURN NEW;
  END;
  $$
`;
