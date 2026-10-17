import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { IdentityProvider } from '@bar/contracts';
import { Repository } from 'typeorm';
import {
  type StaffUserRepository,
  type StaffUserView,
} from '../../domain/staff-user.repository.js';
import { StaffUser } from './staff-user.entity.js';
import { StaffUserIdentity } from './staff-user-identity.entity.js';

@Injectable()
export class StaffUserTypeormRepository implements StaffUserRepository {
  constructor(
    @InjectRepository(StaffUser)
    private readonly users: Repository<StaffUser>,
    @InjectRepository(StaffUserIdentity)
    private readonly identities: Repository<StaffUserIdentity>,
  ) {}

  async findByIdentity(
    provider: IdentityProvider,
    externalId: string,
  ): Promise<StaffUserView | null> {
    const identity = await this.identities.findOne({
      where: { provider, externalId },
    });
    if (!identity) return null;
    const user = await this.users.findOne({ where: { id: identity.userId } });
    if (!user) return null;
    return this.toView(user, identity.avatarUrl);
  }

  async findActiveById(id: string): Promise<StaffUserView | null> {
    const user = await this.users.findOne({ where: { id, isActive: true } });
    if (!user) return null;
    const identity = await this.identities.findOne({
      where: { userId: user.id, provider: 'line' },
    });
    return this.toView(user, identity?.avatarUrl ?? null);
  }

  private toView(user: StaffUser, avatarUrl: string | null): StaffUserView {
    return {
      id: user.id,
      displayName: user.displayName,
      isActive: user.isActive,
      avatarUrl,
    };
  }
}
