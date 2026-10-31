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

export interface StaffPushTokenRepository {
  /** One row per token: a token held by another staff member moves to the new owner. */
  upsert(registration: PushTokenRegistration): Promise<void>;
  deleteOwn(staffUserId: string, token: string): Promise<void>;
  findByStaffIds(staffUserIds: string[]): Promise<RecipientToken[]>;
  deleteTokens(tokens: string[]): Promise<void>;
}

export const STAFF_PUSH_TOKEN_REPOSITORY = Symbol('STAFF_PUSH_TOKEN_REPOSITORY');
