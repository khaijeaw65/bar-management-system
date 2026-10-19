import { Inject, Injectable } from '@nestjs/common';
import { DomainException } from '../../../common/domain-exception.js';
import {
  PAYMENT_REPOSITORY,
  type PaymentRepository,
} from '../domain/ports/payment.repository.port.js';
import { toAttempt, toPayment } from './present-payment.js';

@Injectable()
export class PaymentGuard {
  public constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly payments: PaymentRepository,
  ) {}

  public async assertNoPaymentInFlight(visitId: string): Promise<void> {
    const pending = await this.payments.findPendingByVisit(visitId);
    if (!pending) return;
    throw new DomainException('PAYMENT_IN_FLIGHT', 'มีการชำระเงินที่ยังไม่จบ', 409, {
      details: toAttempt([toPayment(pending)]),
    });
  }

  public async assertNoPaymentInFlightForVenue(): Promise<void> {
    if (!(await this.payments.hasPending())) return;
    throw new DomainException('PAYMENT_IN_FLIGHT', 'มีการชำระเงินที่ยังไม่จบ', 409);
  }
}
