import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { PaymentService } from '../../application/payment.service.js';
import { PAYMENT_EXPIRY_QUEUE, type PaymentExpiryJob } from '../../application/payment.types.js';

@Processor(PAYMENT_EXPIRY_QUEUE)
export class PaymentExpiryProcessor extends WorkerHost {
  public constructor(private readonly payments: PaymentService) {
    super();
  }

  public async process(job: Job<PaymentExpiryJob>): Promise<void> {
    await this.payments.expire(job.data.paymentId);
  }
}
