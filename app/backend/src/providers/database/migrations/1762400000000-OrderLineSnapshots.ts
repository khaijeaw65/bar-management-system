import type { MigrationInterface, QueryRunner } from 'typeorm';

/** DR-022: order lines keep the names and the placing order they were ordered under. */
export class OrderLineSnapshots1762400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const sql of [...ADD_COLUMNS, ...BACKFILL, ...SET_NOT_NULL]) await queryRunner.query(sql);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE order_item_modifier DROP COLUMN option_name_snapshot`);
    await queryRunner.query(
      `ALTER TABLE order_item DROP COLUMN line_no, DROP COLUMN variant_name_snapshot, DROP COLUMN item_name_snapshot`,
    );
  }
}

const ADD_COLUMNS = [
  `ALTER TABLE order_item
     ADD COLUMN item_name_snapshot    VARCHAR(200),
     ADD COLUMN variant_name_snapshot VARCHAR(200),
     ADD COLUMN line_no               SMALLINT`,
  `ALTER TABLE order_item_modifier ADD COLUMN option_name_snapshot VARCHAR(200)`,
];

const BACKFILL = [
  `UPDATE order_item i
     SET item_name_snapshot = mi.name, variant_name_snapshot = v.name
     FROM menu_item_variant v
     JOIN menu_item mi ON mi.id = v.menu_item_id
     WHERE v.id = i.menu_item_variant_id`,
  `UPDATE order_item i
     SET line_no = numbered.line_no
     FROM (
       SELECT oi.id, ROW_NUMBER() OVER (PARTITION BY t.order_id ORDER BY oi.created_at, oi.id) AS line_no
       FROM order_item oi
       JOIN order_ticket t ON t.id = oi.ticket_id
     ) numbered
     WHERE numbered.id = i.id`,
  `UPDATE order_item_modifier m
     SET option_name_snapshot = mo.name
     FROM modifier_option mo
     WHERE mo.id = m.modifier_option_id`,
];

const SET_NOT_NULL = [
  `ALTER TABLE order_item
     ALTER COLUMN item_name_snapshot    SET NOT NULL,
     ALTER COLUMN variant_name_snapshot SET NOT NULL,
     ALTER COLUMN line_no               SET NOT NULL`,
  `ALTER TABLE order_item_modifier ALTER COLUMN option_name_snapshot SET NOT NULL`,
];
