import type { IdentityProvider } from '@bar/contracts';

export interface StaffUserView {
  id: string;
  displayName: string;
  isActive: boolean;
  avatarUrl: string | null;
}

export interface StaffUserRepository {
  findByIdentity(
    provider: IdentityProvider,
    externalId: string,
  ): Promise<StaffUserView | null>;
  findActiveById(id: string): Promise<StaffUserView | null>;
}

export const STAFF_USER_REPOSITORY = Symbol('STAFF_USER_REPOSITORY');
