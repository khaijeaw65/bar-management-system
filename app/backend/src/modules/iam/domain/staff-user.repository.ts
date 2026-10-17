import type { IdentityProvider } from '@bar/contracts';
import type { StaffUserView } from './staff-user.types.js';

export interface StaffUserRepository {
  findByIdentity(
    provider: IdentityProvider,
    externalId: string,
  ): Promise<StaffUserView | null>;
  findActiveById(id: string): Promise<StaffUserView | null>;
  findById(id: string): Promise<StaffUserView | null>;
}

export const STAFF_USER_REPOSITORY = Symbol('STAFF_USER_REPOSITORY');
