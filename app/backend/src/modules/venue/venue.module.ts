import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IamModule } from '../iam/iam.module.js';
import { TableSeatService } from './application/table-seat.service.js';
import { VenueSettingsService } from './application/venue-settings.service.js';
import { VisitService } from './application/visit.service.js';
import { TABLE_SEAT_REPOSITORY } from './domain/table-seat.repository.js';
import { VENUE_REPOSITORY } from './domain/venue.repository.js';
import { VISIT_REPOSITORY } from './domain/visit.repository.js';
import { TablesController } from './infrastructure/http/tables.controller.js';
import { VenueController } from './infrastructure/http/venue.controller.js';
import { VisitsController } from './infrastructure/http/visits.controller.js';
import { TableSeat } from './infrastructure/persistence/table-seat.entity.js';
import { TableSeatTypeormRepository } from './infrastructure/persistence/table-seat.typeorm-repository.js';
import { Venue } from './infrastructure/persistence/venue.entity.js';
import { VenueTypeormRepository } from './infrastructure/persistence/venue.typeorm-repository.js';
import { Visit } from './infrastructure/persistence/visit.entity.js';
import { VisitTypeormRepository } from './infrastructure/persistence/visit.typeorm-repository.js';

@Module({
  imports: [TypeOrmModule.forFeature([TableSeat, Visit, Venue]), IamModule],
  controllers: [TablesController, VisitsController, VenueController],
  providers: [
    TableSeatTypeormRepository,
    VisitTypeormRepository,
    VenueTypeormRepository,
    { provide: TABLE_SEAT_REPOSITORY, useExisting: TableSeatTypeormRepository },
    { provide: VISIT_REPOSITORY, useExisting: VisitTypeormRepository },
    { provide: VENUE_REPOSITORY, useExisting: VenueTypeormRepository },
    TableSeatService,
    VisitService,
    VenueSettingsService,
  ],
  exports: [VisitService, VenueSettingsService],
})
export class VenueModule {}
