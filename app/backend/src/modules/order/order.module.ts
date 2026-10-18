import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IamModule } from '../iam/iam.module.js';
import { MenuModule } from '../menu/menu.module.js';
import { VenueModule } from '../venue/venue.module.js';
import { CLOCK } from '../../common/clock.js';
import { SystemClock } from '../../common/system-clock.js';
import { RedisModule } from '../../providers/redis/redis.module.js';
import { IdempotencyService } from './application/idempotency.service.js';
import { OrderQueryService } from './application/order-query.service.js';
import { OrderService } from './application/order.service.js';
import { TicketService } from './application/ticket.service.js';
import { ORDER_REPOSITORY } from './domain/order.repository.js';
import { OrdersController } from './infrastructure/http/orders.controller.js';
import { TicketsController } from './infrastructure/http/tickets.controller.js';
import { OrderItemModifier } from './infrastructure/persistence/order-item-modifier.entity.js';
import { OrderItem } from './infrastructure/persistence/order-item.entity.js';
import { OrderTicket } from './infrastructure/persistence/order-ticket.entity.js';
import { OrderRecord } from './infrastructure/persistence/order.entity.js';
import { OrderTypeormRepository } from './infrastructure/persistence/order.typeorm-repository.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderRecord, OrderTicket, OrderItem, OrderItemModifier]),
    forwardRef(() => VenueModule),
    MenuModule,
    IamModule,
    RedisModule,
  ],
  controllers: [OrdersController, TicketsController],
  providers: [
    OrderTypeormRepository,
    { provide: ORDER_REPOSITORY, useExisting: OrderTypeormRepository },
    { provide: CLOCK, useClass: SystemClock },
    IdempotencyService,
    OrderQueryService,
    OrderService,
    TicketService,
  ],
  exports: [OrderQueryService],
})
export class OrderModule {}
