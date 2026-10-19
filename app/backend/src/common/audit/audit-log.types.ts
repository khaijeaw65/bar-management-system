import type { AuditAction } from '@bar/contracts';

export interface AuditFieldChange {
  from: string | null;
  to: string | null;
}

export interface AuditRecord {
  entity: string;
  entityId: string;
  action: AuditAction;
  changedFields: Record<string, AuditFieldChange> | null;
}
