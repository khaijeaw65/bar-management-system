import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { VenueModule } from '../venue/venue.module.js';
import { StaffAdminService } from './application/staff-admin.service.js';
import { STAFF_ADMIN_REPOSITORY } from './domain/staff-admin.repository.js';
import { AccessRequestsController, StaffController } from './infrastructure/http/staff.controller.js';
import { StaffAdminTypeormRepository } from './infrastructure/persistence/staff-admin.typeorm-repository.js';
import { IamModule } from './iam.module.js';

/**
 * Owner-side people management (BRIEF-054). A module of its own, next to IamModule, because it needs
 * AuthModule (end sessions) and VenueModule (business-day cut-off) — both already import IamModule,
 * so IamModule itself cannot import them back.
 */
@Module({
  imports: [IamModule, AuthModule, VenueModule],
  // AccessRequestsController first: `/staff/access-requests` must not be read as `/staff/:id`.
  controllers: [AccessRequestsController, StaffController],
  providers: [
    StaffAdminTypeormRepository,
    { provide: STAFF_ADMIN_REPOSITORY, useExisting: StaffAdminTypeormRepository },
    StaffAdminService,
  ],
})
export class StaffAdminModule {}
