import { Inject, Injectable } from '@nestjs/common';
import type { IdentityProvider } from '@bar/contracts';
import {
  STAFF_USER_REPOSITORY,
  type StaffUserRepository,
  type StaffUserView,
} from '../domain/staff-user.repository.js';

@Injectable()
export class StaffUserService {
  public constructor(
    @Inject(STAFF_USER_REPOSITORY)
    private readonly staffUsers: StaffUserRepository,
  ) {}

  public findByIdentity(
    provider: IdentityProvider,
    externalId: string,
  ): Promise<StaffUserView | null> {
    return this.staffUsers.findByIdentity(provider, externalId);
  }

  public findActiveById(id: string): Promise<StaffUserView | null> {
    return this.staffUsers.findActiveById(id);
  }
}
