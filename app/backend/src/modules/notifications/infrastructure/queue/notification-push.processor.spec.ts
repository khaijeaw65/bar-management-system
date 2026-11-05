import { describe, expect, it, vi } from 'vitest';
import type { Job } from 'bullmq';
import type { PushDeliveryService } from '../../application/push-delivery.service.js';
import type { PushJobData } from '../../application/push.types.js';
import { NotificationPushProcessor } from './notification-push.processor.js';

describe('NotificationPushProcessor', () => {
  const createProcessor = () => {
    const delivery = {
      deliver: vi.fn(async () => undefined),
      checkReceipts: vi.fn(async () => undefined),
    };
    const processor = new NotificationPushProcessor(delivery as unknown as PushDeliveryService);
    return { processor, delivery };
  };
  const job = (name: string, data: PushJobData) => ({ name, data }) as Job<PushJobData>;

  it('routes by job name', async () => {
    const { processor, delivery } = createProcessor();
    await processor.process(job('send', { notifications: [] }));
    await processor.process(job('receipts', { tokenByReceiptId: {} }));

    expect(delivery.deliver).toHaveBeenCalledTimes(1);
    expect(delivery.checkReceipts).toHaveBeenCalledTimes(1);
  });

  it('fails a job whose name does not match its payload', async () => {
    const { processor, delivery } = createProcessor();

    await expect(processor.process(job('receipts', { notifications: [] }))).rejects.toThrow(/unknown/);
    await expect(processor.process(job('other', { tokenByReceiptId: {} }))).rejects.toThrow(/unknown/);
    expect(delivery.deliver).not.toHaveBeenCalled();
    expect(delivery.checkReceipts).not.toHaveBeenCalled();
  });
});
