import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { PushDeliveryService } from '../../application/push-delivery.service.js';
import { NOTIFICATION_PUSH_QUEUE, type PushJobData } from '../../application/push.types.js';

@Processor(NOTIFICATION_PUSH_QUEUE)
export class NotificationPushProcessor extends WorkerHost {
  public constructor(private readonly delivery: PushDeliveryService) {
    super();
  }

  public async process(job: Job<PushJobData>): Promise<void> {
    if ('notifications' in job.data) {
      await this.delivery.deliver(job.data);
      return;
    }
    await this.delivery.checkReceipts(job.data);
  }
}
