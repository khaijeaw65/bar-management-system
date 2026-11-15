import type { MigrationInterface, QueryRunner } from 'typeorm';

/** BRIEF-066: active seat labels are unique on `lower(trim(label))`; retired seats can be reused. */
export class TableSeatLabelUnique1763500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const duplicates: { label: string }[] = await queryRunner.query(
      `SELECT lower(trim(label)) AS label FROM table_seat
       WHERE is_active = true
       GROUP BY lower(trim(label)) HAVING COUNT(*) > 1 ORDER BY 1`,
    );
    if (duplicates.length > 0) {
      const labels = duplicates.map((row) => `"${row.label}"`).join(', ');
      throw new Error(`table_seat has duplicate active labels, rename them first: ${labels}`);
    }
    await queryRunner.query(
      `CREATE UNIQUE INDEX uq_table_seat_label_active ON table_seat (lower(trim(label))) WHERE is_active`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX uq_table_seat_label_active`);
  }
}
