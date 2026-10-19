import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { ClsService } from 'nestjs-cls';
import type { AuditRecord } from './audit-log.types.js';

// Insert only. audit_log is append-only — this service has no update or delete.
const INSERT_AUDIT = `
  INSERT INTO audit_log (entity, entity_id, action, changed_fields, changed_by)
  VALUES ($1, $2, $3::audit_action, $4::jsonb, $5)
`;

@Injectable()
export class AuditLogService {
  public constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
    private readonly cls: ClsService,
  ) {}

  public async record(input: AuditRecord): Promise<void> {
    await this.txHost.tx.query(INSERT_AUDIT, [
      input.entity,
      input.entityId,
      input.action,
      JSON.stringify(input.changedFields),
      this.staffId(),
    ]);
  }

  private staffId(): string | null {
    const userId: unknown = this.cls.get('userId');
    if (typeof userId !== 'string' || userId.length === 0) return null;
    return userId;
  }
}
