import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { Ok, RegisterPushToken } from '@bar/contracts';
import { CLOCK, type Clock } from '../../../common/clock.js';
import { DomainException } from '../../../common/domain-exception.js';
import { StaffPushTokenEntity } from '../infrastructure/persistence/staff-push-token.entity.js';
import { PUSH_SENDER, type PushSender } from './ports/push-sender.port.js';
import type { RecipientToken } from './push.types.js';

@Injectable()
export class PushTokenService {
  public constructor(
    @InjectRepository(StaffPushTokenEntity)
    private readonly repo: Repository<StaffPushTokenEntity>,
    @Inject(PUSH_SENDER) private readonly sender: PushSender,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** A token already held by another staff member is reassigned to the caller (shared phones). */
  public async register(staffUserId: string, input: RegisterPushToken): Promise<Ok> {
    this.verifyTokenFormat(input.token);
    await this.repo.upsert(
      {
        staffUserId,
        expoPushToken: input.token,
        platform: input.platform,
        lastSeenAt: this.clock.now(),
      },
      ['expoPushToken'],
    );
    return { ok: true };
  }

  /** Own token only; an unknown or foreign token is a silent no-op. */
  public async unregister(staffUserId: string, token: string): Promise<void> {
    await this.repo.delete({ staffUserId, expoPushToken: token });
  }

  public async findByRecipients(recipientIds: string[]): Promise<RecipientToken[]> {
    const rows = await this.repo.find({ where: { staffUserId: In(recipientIds) } });
    return rows.map((row) => ({ staffUserId: row.staffUserId, token: row.expoPushToken }));
  }

  public async removeTokens(tokens: string[]): Promise<void> {
    if (tokens.length === 0) return;
    await this.repo.delete({ expoPushToken: In(tokens) });
  }

  private verifyTokenFormat(token: string): void {
    if (this.sender.isValidToken(token)) return;
    throw new DomainException('VALIDATION_ERROR', 'push token ไม่ถูกต้อง', 400);
  }
}
