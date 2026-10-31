import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { VenueModule } from '../venue/venue.module.js';
import { IamAdminService } from './application/iam-admin.service.js';
import { StaffAdminService } from './application/staff-admin.service.js';
import { IAM_ADMIN_REPOSITORY } from './domain/iam-admin.repository.js';
import { STAFF_ADMIN_REPOSITORY } from './domain/staff-admin.repository.js';
import {
  PermissionCatalogController,
  PoliciesController,
  StaffGroupsController,
} from './infrastructure/http/iam-admin.controller.js';
import { AccessRequestsController, StaffController } from './infrastructure/http/staff.controller.js';
import { IamAdminTypeormRepository } from './infrastructure/persistence/iam-admin.typeorm-repository.js';
import { StaffAdminTypeormRepository } from './infrastructure/persistence/staff-admin.typeorm-repository.js';
import { IamModule } from './iam.module.js';

/**
 * Owner-side people, group and policy management (BRIEF-054, BRIEF-055). A module of its own, next to IamModule, because it needs
 * AuthModule (end sessions) and VenueModule (business-day cut-off) — both already import IamModule,
 * so IamModule itself cannot import them back.
 */
@Module({
  imports: [IamModule, AuthModule, VenueModule],
  // AccessRequestsController first: `/staff/access-requests` must not be read as `/staff/:id`.
  controllers: [
    AccessRequestsController,
    StaffController,
    PermissionCatalogController,
    StaffGroupsController,
    PoliciesController,
  ],
  providers: [
    StaffAdminTypeormRepository,
    { provide: STAFF_ADMIN_REPOSITORY, useExisting: StaffAdminTypeormRepository },
    StaffAdminService,
    IamAdminTypeormRepository,
    { provide: IAM_ADMIN_REPOSITORY, useExisting: IamAdminTypeormRepository },
    IamAdminService,
  ],
})
export class StaffAdminModule {}
