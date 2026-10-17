import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { IdentityProvider } from '@bar/contracts';
import { Repository } from 'typeorm';
import { StaffAccessRequest } from '../infrastructure/persistence/staff-access-request.entity.js';

@Injectable()
export class AccessRequestService {
  constructor(
    @InjectRepository(StaffAccessRequest)
    private readonly requests: Repository<StaffAccessRequest>,
  ) {}

  async recordRequest(
    provider: IdentityProvider,
    externalId: string,
    displayName: string | null,
    avatarUrl: string | null,
  ): Promise<void> {
    const existing = await this.requests.findOne({
      where: { provider, externalId },
    });
    if (!existing) {
      await this.requests.save(
        this.requests.create({
          provider,
          externalId,
          displayName,
          avatarUrl,
          status: 'pending',
        }),
      );
      return;
    }
    existing.displayName = displayName;
    existing.avatarUrl = avatarUrl;
    await this.requests.save(existing);
  }
}
