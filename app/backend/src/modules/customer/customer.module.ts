import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Clock } from '../../common/clock.js';
import { SystemClock } from '../../common/system-clock.js';
import { AppConfigModule } from '../../providers/config/app/config.module.js';
import { MenuModule } from '../menu/menu.module.js';
import { IdempotencyService } from '../../common/idempotency/idempotency.service.js';
import { OrderModule } from '../order/order.module.js';
import { PaymentModule } from '../payment/payment.module.js';
import { VenueModule } from '../venue/venue.module.js';
import { CustomerCallService } from './application/customer-call.service.js';
import { CustomerPaymentService } from './application/customer-payment.service.js';
import { CustomerMenuService } from './application/customer-menu.service.js';
import { CustomerOrderService } from './application/customer-order.service.js';
import { CustomerTabGateway } from './application/customer-tab-gateway.js';
import { CustomerTabService } from './application/customer-tab.service.js';
import { CustomerThrottle } from './application/customer-throttle.js';
import { GuestSessionService } from './application/guest-session.service.js';
import { GuestSessionRepository } from './domain/guest-session.repository.js';
import { CustomerPaymentController } from './infrastructure/http/customer-payment.controller.js';
import { CustomerOrderController } from './infrastructure/http/customer-order.controller.js';
import { CustomerMenuController } from './infrastructure/http/customer-menu.controller.js';
import { CustomerScanController } from './infrastructure/http/customer-qr.controller.js';
import { CustomerSessionController } from './infrastructure/http/customer-session.controller.js';
import { GuestSessionGuard } from './infrastructure/http/guest-session.guard.js';
import { CustomerGateway } from './infrastructure/ws/customer.gateway.js';
import { GuestSession } from './infrastructure/persistence/guest-session.entity.js';
import { GuestSessionTypeormRepository } from './infrastructure/persistence/guest-session.typeorm-repository.js';

@Module({
  imports: [TypeOrmModule.forFeature([GuestSession]), AppConfigModule, VenueModule, MenuModule, OrderModule, PaymentModule],
  controllers: [
    CustomerScanController,
    CustomerSessionController,
    CustomerMenuController,
    CustomerOrderController,
    CustomerPaymentController,
  ],
  providers: [
    GuestSessionTypeormRepository,
    { provide: GuestSessionRepository, useExisting: GuestSessionTypeormRepository },
    { provide: Clock, useClass: SystemClock },
    CustomerThrottle,
    GuestSessionService,
    CustomerMenuService,
    CustomerOrderService,
    CustomerTabService,
    CustomerCallService,
    CustomerPaymentService,
    IdempotencyService,
    CustomerGateway,
    { provide: CustomerTabGateway, useExisting: CustomerGateway },
    GuestSessionGuard,
  ],
})
export class CustomerModule {}
