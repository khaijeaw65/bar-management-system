import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CLOCK } from '../../common/clock.js';
import { IdempotencyService } from '../../common/idempotency/idempotency.service.js';
import { SystemClock } from '../../common/system-clock.js';
import { AuditLogService } from '../../common/audit/audit-log.service.js';
import { EasySlipConfigModule } from '../../providers/config/easyslip/config.module.js';
import { PaymentConfigModule } from '../../providers/config/payment/config.module.js';
import { IamModule } from '../iam/iam.module.js';
import { OrderModule } from '../order/order.module.js';
import { VenueModule } from '../venue/venue.module.js';
import { BillService } from './application/bill.service.js';
import { PaymentGuard } from './application/payment-guard.js';
import { PaymentService } from './application/payment.service.js';
import { PAYMENT_EXPIRY_QUEUE } from './application/payment.types.js';
import { PAYMENT_REPOSITORY } from './domain/ports/payment.repository.port.js';
import { SLIP_VERIFIER } from './domain/ports/slip-verifier.port.js';
import { EasySlipSlipVerifier } from './infrastructure/easyslip/easyslip-slip-verifier.js';
import { PaymentsController } from './infrastructure/http/payments.controller.js';
import { PaymentOrderLink } from './infrastructure/persistence/payment-order.entity.js';
import { Payment } from './infrastructure/persistence/payment.entity.js';
import { PaymentTypeormRepository } from './infrastructure/persistence/payment.typeorm-repository.js';
import { PaymentExpiryProcessor } from './infrastructure/queue/payment-expiry.processor.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, PaymentOrderLink]),
    BullModule.registerQueue({ name: PAYMENT_EXPIRY_QUEUE }),
    PaymentConfigModule,
    EasySlipConfigModule,
    forwardRef(() => VenueModule),
    forwardRef(() => OrderModule),
    IamModule,
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentTypeormRepository,
    { provide: PAYMENT_REPOSITORY, useExisting: PaymentTypeormRepository },
    { provide: CLOCK, useClass: SystemClock },
    IdempotencyService,
    BillService,
    PaymentGuard,
    PaymentService,
    PaymentExpiryProcessor,
    AuditLogService,
    EasySlipSlipVerifier,
    { provide: SLIP_VERIFIER, useExisting: EasySlipSlipVerifier },
  ],
  exports: [BillService, PaymentGuard, PaymentService],
})
export class PaymentModule {}
