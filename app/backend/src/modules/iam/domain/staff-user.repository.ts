import type { IdentityProvider } from '@bar/contracts';
import type { StaffUserView } from './staff-user.types.js';

export abstract class StaffUserRepository {
  public abstract findByIdentity(
    provider: IdentityProvider,
    externalId: string,
  ): Promise<StaffUserView | null>;
  public abstract findActiveById(id: string): Promise<StaffUserView | null>;
  public abstract findById(id: string): Promise<StaffUserView | null>;
}
