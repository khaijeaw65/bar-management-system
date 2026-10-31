import { Inject, Injectable } from '@nestjs/common';
import type { Ok, RegisterPushToken } from '@bar/contracts';
import { CLOCK, type Clock } from '../../../common/clock.js';
import { DomainException } from '../../../common/domain-exception.js';
import { PUSH_SENDER, type PushSender } from './ports/push-sender.port.js';
import {
  STAFF_PUSH_TOKEN_REPOSITORY,
  type RecipientToken,
  type StaffPushTokenRepository,
} from './ports/staff-push-token.repository.port.js';

@Injectable()
export class PushTokenService {
  public constructor(
    @Inject(STAFF_PUSH_TOKEN_REPOSITORY) private readonly tokens: StaffPushTokenRepository,
    @Inject(PUSH_SENDER) private readonly sender: PushSender,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** A token already held by another staff member is reassigned to the caller (shared phones). */
  public async register(staffUserId: string, input: RegisterPushToken): Promise<Ok> {
    this.verifyTokenFormat(input.token);
    await this.tokens.upsert({
      staffUserId,
      token: input.token,
      platform: input.platform,
      lastSeenAt: this.clock.now(),
    });
    return { ok: true };
  }

  /** Own token only; an unknown or foreign token is a silent no-op. */
  public async unregister(staffUserId: string, token: string): Promise<void> {
    await this.tokens.deleteOwn(staffUserId, token);
  }

  public async findByRecipients(recipientIds: string[]): Promise<RecipientToken[]> {
    return await this.tokens.findByStaffIds(recipientIds);
  }

  public async removeTokens(tokens: string[]): Promise<void> {
    if (tokens.length === 0) return;
    await this.tokens.deleteTokens(tokens);
  }

  private verifyTokenFormat(token: string): void {
    if (this.sender.isValidToken(token)) return;
    throw new DomainException('VALIDATION_ERROR', 'push token ไม่ถูกต้อง', 400);
  }
}
