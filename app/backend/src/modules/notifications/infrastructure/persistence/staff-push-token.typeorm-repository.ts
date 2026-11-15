import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type {
  PushTokenRegistration,
  RecipientToken,
  StaffPushTokenRepository,
} from '../../application/ports/staff-push-token.repository.port.js';
import { StaffPushTokenEntity } from './staff-push-token.entity.js';

@Injectable()
export class StaffPushTokenTypeormRepository implements StaffPushTokenRepository {
  public constructor(
    @InjectRepository(StaffPushTokenEntity)
    private readonly repo: Repository<StaffPushTokenEntity>,
  ) {}

  public async upsert(registration: PushTokenRegistration): Promise<void> {
    await this.repo.upsert(
      {
        staffUserId: registration.staffUserId,
        expoPushToken: registration.token,
        platform: registration.platform,
        lastSeenAt: registration.lastSeenAt,
      },
      ['expoPushToken'],
    );
  }

  public async deleteOwn(staffUserId: string, token: string): Promise<void> {
    await this.repo.delete({ staffUserId, expoPushToken: token });
  }

  public async findByStaffIds(staffUserIds: string[]): Promise<RecipientToken[]> {
    const rows = await this.repo.find({ where: { staffUserId: In(staffUserIds) } });
    return rows.map((row) => ({ staffUserId: row.staffUserId, token: row.expoPushToken }));
  }

  public async deleteTokens(tokens: string[]): Promise<void> {
    await this.repo.delete({ expoPushToken: In(tokens) });
  }
}
