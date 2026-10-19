import type { MigrationInterface, QueryRunner } from 'typeorm';

/** audit_action + audit_log from schema.sql §9. Append-only. */
export class AuditLog1762300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE audit_action AS ENUM ('CREATE', 'UPDATE')`);
    await queryRunner.query(AUDIT_LOG);
    for (const index of INDEXES) await queryRunner.query(index);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE audit_log`);
    await queryRunner.query(`DROP TYPE audit_action`);
  }
}

const AUDIT_LOG = `
  CREATE TABLE audit_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity          VARCHAR(100) NOT NULL,
    entity_id       UUID NOT NULL,
    action          audit_action NOT NULL,
    changed_fields  JSONB,
    changed_by      UUID,
    changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

const INDEXES = [
  `CREATE INDEX idx_audit_entity ON audit_log(entity, entity_id)`,
  `CREATE INDEX idx_audit_changed_by ON audit_log(changed_by)`,
  `CREATE INDEX idx_audit_changed_at ON audit_log(changed_at DESC)`,
];
