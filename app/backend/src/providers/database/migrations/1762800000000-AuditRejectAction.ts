import type { MigrationInterface, QueryRunner } from 'typeorm';

/** BRIEF-025 Q1: a rejected slip writes audit_log.action = REJECT. */
export class AuditRejectAction1762800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'REJECT'`);
  }

  public async down(): Promise<void> {
    // Postgres cannot drop a value from an existing enum.
  }
}
