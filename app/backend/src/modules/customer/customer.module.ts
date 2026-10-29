import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CLOCK } from '../../common/clock.js';
import { SystemClock } from '../../common/system-clock.js';
import { AppConfigModule } from '../../providers/config/app/config.module.js';
import { MenuModule } from '../menu/menu.module.js';
import { VenueModule } from '../venue/venue.module.js';
import { CustomerMenuService } from './application/customer-menu.service.js';
import { CustomerThrottle } from './application/customer-throttle.js';
import { GuestSessionService } from './application/guest-session.service.js';
import { GUEST_SESSION_REPOSITORY } from './domain/guest-session.repository.js';
import { CustomerMenuController } from './infrastructure/http/customer-menu.controller.js';
import {
  CustomerScanController,
  CustomerSessionController,
} from './infrastructure/http/customer-session.controller.js';
import { GuestSessionGuard } from './infrastructure/http/guest-session.guard.js';
import { GuestSession } from './infrastructure/persistence/guest-session.entity.js';
import { GuestSessionTypeormRepository } from './infrastructure/persistence/guest-session.typeorm-repository.js';

@Module({
  imports: [TypeOrmModule.forFeature([GuestSession]), AppConfigModule, VenueModule, MenuModule],
  controllers: [CustomerScanController, CustomerSessionController, CustomerMenuController],
  providers: [
    GuestSessionTypeormRepository,
    { provide: GUEST_SESSION_REPOSITORY, useExisting: GuestSessionTypeormRepository },
    { provide: CLOCK, useClass: SystemClock },
    CustomerThrottle,
    GuestSessionService,
    CustomerMenuService,
    GuestSessionGuard,
  ],
})
export class CustomerModule {}
