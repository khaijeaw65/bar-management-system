import { Inject, Injectable } from '@nestjs/common';
import type { IdentityProvider } from '@bar/contracts';
import {
  STAFF_USER_REPOSITORY,
  type StaffUserRepository,
  type StaffUserView,
} from '../domain/staff-user.repository.js';

@Injectable()
export class StaffUserService {
  constructor(
    @Inject(STAFF_USER_REPOSITORY)
    private readonly staffUsers: StaffUserRepository,
  ) {}

  findByIdentity(
    provider: IdentityProvider,
    externalId: string,
  ): Promise<StaffUserView | null> {
    return this.staffUsers.findByIdentity(provider, externalId);
  }

  findActiveById(id: string): Promise<StaffUserView | null> {
    return this.staffUsers.findActiveById(id);
  }
}
