import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessRequestService } from './application/access-request.service.js';
import { StaffUserService } from './application/staff-user.service.js';
import { STAFF_USER_REPOSITORY } from './domain/staff-user.repository.js';
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
  providers: [
    StaffUserTypeormRepository,
    { provide: STAFF_USER_REPOSITORY, useExisting: StaffUserTypeormRepository },
    StaffUserService,
    AccessRequestService,
  ],
  exports: [StaffUserService, AccessRequestService],
})
export class IamModule {}
