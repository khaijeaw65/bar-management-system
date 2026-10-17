import { UuidSchema } from '@bar/contracts';
import { DomainException } from '../../../../common/domain-exception.js';

export function idempotencyKey(header: string | undefined): string | null {
  if (!header) return null;
  const parsed = UuidSchema.safeParse(header);
  if (!parsed.success) throw new DomainException('VALIDATION_ERROR', 'คีย์ไม่ถูกต้อง', 400);
  return parsed.data;
}
