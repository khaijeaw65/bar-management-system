import { Injectable } from '@nestjs/common';
import type { IdentityProvider } from '@bar/contracts';
import { StaffUserRepository } from '../domain/staff-user.repository.js';
import type { StaffUserView } from '../domain/staff-user.types.js';

@Injectable()
export class StaffUserService {
  public constructor(
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

  public findById(id: string): Promise<StaffUserView | null> {
    return this.staffUsers.findById(id);
  }
}
