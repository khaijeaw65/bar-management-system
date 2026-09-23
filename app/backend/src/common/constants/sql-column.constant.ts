/**
 * Shared TypeORM column type constants.
 * Use COL.* everywhere — no magic strings in entity definitions.
 */
export const COL = {
  UUID: 'uuid' as const,
  TEXT: 'text' as const,
  VARCHAR: 'varchar' as const,
  INT: 'integer' as const,
  BIGINT: 'bigint' as const,
  DECIMAL: 'decimal' as const,
  BOOLEAN: 'boolean' as const,
  JSONB: 'jsonb' as const,
  TIMESTAMP: 'timestamp with time zone' as const,
  DATE: 'date' as const,
  ENUM: 'enum' as const,
} as const;
