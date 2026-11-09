import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Clock } from '../../common/clock.js';
import { SystemClock } from '../../common/system-clock.js';
import { AuditLogService } from '../../common/audit/audit-log.service.js';
import { IamModule } from '../iam/iam.module.js';
import { OrderModule } from '../order/order.module.js';
import { PaymentModule } from '../payment/payment.module.js';
import { TableAdminService } from './application/table-admin.service.js';
import { TableSeatService } from './application/table-seat.service.js';
import { VenueSettingsService } from './application/venue-settings.service.js';
import { VisitService } from './application/visit.service.js';
import { ITableSeatAdminRepository } from './domain/table-seat-admin.repository.js';
import { TableSeatRepository } from './domain/table-seat.repository.js';
import { VenueRepository } from './domain/venue.repository.js';
import { VisitRepository } from './domain/visit.repository.js';
import { TablesController } from './infrastructure/http/tables.controller.js';
import { VenueController } from './infrastructure/http/venue.controller.js';
import { VisitsController } from './infrastructure/http/visits.controller.js';
import { TableSeat } from './infrastructure/persistence/table-seat.entity.js';
import { TableSeatAdminTypeormRepository } from './infrastructure/persistence/table-seat-admin.typeorm-repository.js';
import { TableSeatTypeormRepository } from './infrastructure/persistence/table-seat.typeorm-repository.js';
import { Venue } from './infrastructure/persistence/venue.entity.js';
import { VenueTypeormRepository } from './infrastructure/persistence/venue.typeorm-repository.js';
import { Visit } from './infrastructure/persistence/visit.entity.js';
import { VisitTypeormRepository } from './infrastructure/persistence/visit.typeorm-repository.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([TableSeat, Visit, Venue]),
    IamModule,
    forwardRef(() => OrderModule),
    forwardRef(() => PaymentModule),
  ],
  controllers: [TablesController, VisitsController, VenueController],
  providers: [
    TableSeatTypeormRepository,
    TableSeatAdminTypeormRepository,
    VisitTypeormRepository,
    VenueTypeormRepository,
    { provide: TableSeatRepository, useExisting: TableSeatTypeormRepository },
    { provide: ITableSeatAdminRepository, useClass: TableSeatAdminTypeormRepository },
    { provide: VisitRepository, useExisting: VisitTypeormRepository },
    { provide: VenueRepository, useExisting: VenueTypeormRepository },
    TableSeatService,
    TableAdminService,
    VisitService,
    VenueSettingsService,
    AuditLogService,
    { provide: Clock, useClass: SystemClock },
  ],
  exports: [VisitService, VenueSettingsService, TableSeatService, TableAdminService],
})
export class VenueModule {}
