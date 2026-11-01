import type { PushPlatform } from '@bar/contracts';

export interface RecipientToken {
  staffUserId: string;
  token: string;
}

export interface PushTokenRegistration {
  staffUserId: string;
  token: string;
  platform: PushPlatform;
  lastSeenAt: Date;
}

export abstract class StaffPushTokenRepository {
  /** One row per token: a token held by another staff member moves to the new owner. */
  public abstract upsert(registration: PushTokenRegistration): Promise<void>;
  public abstract deleteOwn(staffUserId: string, token: string): Promise<void>;
  public abstract findByStaffIds(staffUserIds: string[]): Promise<RecipientToken[]>;
  public abstract deleteTokens(tokens: string[]): Promise<void>;
}
