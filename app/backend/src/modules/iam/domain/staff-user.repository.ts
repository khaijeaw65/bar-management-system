import type { IdentityProvider } from '@bar/contracts';
import type { StaffPinRecord, StaffUserView } from './staff-user.types.js';

export abstract class StaffUserRepository {
  public abstract findByIdentity(
    provider: IdentityProvider,
    externalId: string,
  ): Promise<StaffUserView | null>;
  public abstract findActiveById(id: string): Promise<StaffUserView | null>;
  public abstract findById(id: string): Promise<StaffUserView | null>;
  public abstract findPinById(id: string): Promise<StaffPinRecord | null>;
  public abstract findActiveWithPin(): Promise<StaffPinRecord[]>;
  public abstract savePin(id: string, posPinHash: string | null): Promise<void>;
}
