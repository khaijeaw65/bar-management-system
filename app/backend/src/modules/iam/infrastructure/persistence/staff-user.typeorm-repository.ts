import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { IdentityProvider } from '@bar/contracts';
import { Repository } from 'typeorm';
import { type StaffUserRepository } from '../../domain/staff-user.repository.js';
import type { StaffUserView, StaffUserLookup } from '../../domain/staff-user.types.js';
import { StaffUser } from './staff-user.entity.js';
import { StaffUserIdentity } from './staff-user-identity.entity.js';

@Injectable()
export class StaffUserTypeormRepository implements StaffUserRepository {
  public constructor(
    @InjectRepository(StaffUser)
    private readonly users: Repository<StaffUser>,
    @InjectRepository(StaffUserIdentity)
    private readonly identities: Repository<StaffUserIdentity>,
  ) {}

  public async findByIdentity(
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

  public findActiveById(id: string): Promise<StaffUserView | null> {
    return this.findView({ id, isActive: true });
  }

  public findById(id: string): Promise<StaffUserView | null> {
    return this.findView({ id });
  }

  private async findView(where: StaffUserLookup): Promise<StaffUserView | null> {
    const user = await this.users.findOne({ where });
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
