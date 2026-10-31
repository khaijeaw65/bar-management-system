import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { PushDeliveryService } from '../../application/push-delivery.service.js';
import {
  NOTIFICATION_PUSH_QUEUE,
  PUSH_RECEIPTS_JOB,
  PUSH_SEND_JOB,
  type PushJobData,
} from '../../application/push.types.js';

@Processor(NOTIFICATION_PUSH_QUEUE)
export class NotificationPushProcessor extends WorkerHost {
  public constructor(private readonly delivery: PushDeliveryService) {
    super();
  }

  public async process(job: Job<PushJobData>): Promise<void> {
    if (job.name === PUSH_SEND_JOB && 'notifications' in job.data) {
      return await this.delivery.deliver(job.data);
    }
    if (job.name === PUSH_RECEIPTS_JOB && 'tokenByReceiptId' in job.data) {
      return await this.delivery.checkReceipts(job.data);
    }
    throw new Error(`unknown ${NOTIFICATION_PUSH_QUEUE} job: ${job.name}`);
  }
}
