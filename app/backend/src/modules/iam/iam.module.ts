import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessRequestService } from './application/access-request.service.js';
import { IamEnforcement } from './application/iam-enforcement.service.js';
import { IamVersion } from './application/iam-version.service.js';
import { PermissionResolver } from './application/permission-resolver.service.js';
import { StaffUserService } from './application/staff-user.service.js';
import { ACCESS_REQUEST_REPOSITORY } from './domain/access-request.repository.js';
import { PERMISSION_SOURCE } from './domain/permission-source.js';
import { STAFF_USER_REPOSITORY } from './domain/staff-user.repository.js';
import { MeController } from './infrastructure/http/me.controller.js';
import { AccessRequestTypeormRepository } from './infrastructure/persistence/access-request.typeorm-repository.js';
import { PermissionSourceTypeorm } from './infrastructure/persistence/permission-source.typeorm.js';
import { StaffAccessRequest } from './infrastructure/persistence/staff-access-request.entity.js';
import { StaffUser } from './infrastructure/persistence/staff-user.entity.js';
import { StaffUserIdentity } from './infrastructure/persistence/staff-user-identity.entity.js';
import { StaffUserTypeormRepository } from './infrastructure/persistence/staff-user.typeorm-repository.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StaffUser,
      StaffUserIdentity,
      StaffAccessRequest,
    ]),
  ],
  controllers: [MeController],
  providers: [
    PermissionSourceTypeorm,
    { provide: PERMISSION_SOURCE, useExisting: PermissionSourceTypeorm },
    IamVersion,
    PermissionResolver,
    IamEnforcement,
    StaffUserTypeormRepository,
    { provide: STAFF_USER_REPOSITORY, useExisting: StaffUserTypeormRepository },
    AccessRequestTypeormRepository,
    { provide: ACCESS_REQUEST_REPOSITORY, useExisting: AccessRequestTypeormRepository },
    StaffUserService,
    AccessRequestService,
  ],
  exports: [StaffUserService, AccessRequestService, PermissionResolver, IamEnforcement, IamVersion],
})
export class IamModule {}
