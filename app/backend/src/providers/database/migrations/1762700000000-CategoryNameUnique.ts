import type { MigrationInterface, QueryRunner } from 'typeorm';

/** DR-025: category names are unique on `lower(trim(name))`, hidden categories included. */
export class CategoryNameUnique1762700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const duplicates: { name: string }[] = await queryRunner.query(
      `SELECT lower(trim(name)) AS name FROM menu_category
       GROUP BY lower(trim(name)) HAVING COUNT(*) > 1 ORDER BY 1`,
    );
    if (duplicates.length > 0) {
      const names = duplicates.map((row) => `"${row.name}"`).join(', ');
      throw new Error(`menu_category has duplicate names, rename them first: ${names}`);
    }
    await queryRunner.query(
      `CREATE UNIQUE INDEX uq_menu_category_name ON menu_category (lower(trim(name)))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX uq_menu_category_name`);
  }
}
