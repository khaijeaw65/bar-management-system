import { UuidSchema } from '@bar/contracts';
import { DomainException } from '../../../../common/domain-exception.js';

export function requireUuid(id: string, message: string): string {
  const parsed = UuidSchema.safeParse(id);
  if (!parsed.success) throw new DomainException('NOT_FOUND', message, 404);
  return parsed.data;
}

export function staffAccess(permission: string): string {
  return `Permission: ${permission}. Access token from the access_token cookie, or Authorization: Bearer.`;
}
