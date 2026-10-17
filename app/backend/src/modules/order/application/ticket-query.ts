import type { OrderStatus } from '@bar/contracts';
import { OrderStatusSchema } from '@bar/contracts';
import { DomainException } from '../../../common/domain-exception.js';

const QUEUE: OrderStatus[] = ['pending', 'accepted', 'ready'];

export function queueStatuses(value: string | undefined): OrderStatus[] {
  if (!value) return QUEUE;
  const parsed = value.split(',').map((part) => OrderStatusSchema.safeParse(part.trim()));
  if (parsed.some((item) => !item.success)) {
    throw new DomainException('VALIDATION_ERROR', 'สถานะไม่ถูกต้อง', 400);
  }
  return parsed.flatMap((item) => (item.success ? [item.data] : []));
}
