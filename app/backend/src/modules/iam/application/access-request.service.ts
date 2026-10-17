import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { IdentityProvider } from '@bar/contracts';
import { Repository } from 'typeorm';
import { StaffAccessRequest } from '../infrastructure/persistence/staff-access-request.entity.js';

@Injectable()
export class AccessRequestService {
  public constructor(
    @InjectRepository(StaffAccessRequest)
    private readonly requests: Repository<StaffAccessRequest>,
  ) {}

  public async recordRequest(
    provider: IdentityProvider,
    externalId: string,
    displayName: string | null,
    avatarUrl: string | null,
  ): Promise<void> {
    const existing = await this.requests.findOne({
      where: { provider, externalId },
    });
    if (!existing) {
      await this.insertRequest(provider, externalId, displayName, avatarUrl);
      return;
    }
    await this.updateRequest(existing, displayName, avatarUrl);
  }

  private async insertRequest(
    provider: IdentityProvider,
    externalId: string,
    displayName: string | null,
    avatarUrl: string | null,
  ): Promise<void> {
    await this.requests.save(
      this.requests.create({
        provider,
        externalId,
        displayName,
        avatarUrl,
        status: 'pending',
      }),
    );
  }

  private async updateRequest(
    existing: StaffAccessRequest,
    displayName: string | null,
    avatarUrl: string | null,
  ): Promise<void> {
    existing.displayName = displayName;
    existing.avatarUrl = avatarUrl;
    await this.requests.save(existing);
  }
}
