import type { MigrationInterface, QueryRunner } from 'typeorm';

/** DR-024: an add-on group is archived, never deleted — past orders keep pointing at its options. */
export class ModifierGroupArchive1762600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE modifier_group ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE modifier_group DROP COLUMN is_active`);
  }
}
