import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { type AccessRequestRepository } from '../../domain/access-request.repository.js';
import type { AccessRequestInput } from '../../domain/access-request.types.js';
import { StaffAccessRequest } from './staff-access-request.entity.js';

@Injectable()
export class AccessRequestTypeormRepository implements AccessRequestRepository {
  public constructor(
    @InjectRepository(StaffAccessRequest)
    private readonly accessRequests: Repository<StaffAccessRequest>,
  ) {}

  public async recordPending(input: AccessRequestInput): Promise<void> {
    const existing = await this.accessRequests.findOne({
      where: { provider: input.provider, externalId: input.externalId },
    });
    if (!existing) {
      await this.insertRequest(input);
      return;
    }
    await this.updateRequest(existing, input.displayName, input.avatarUrl);
  }

  private async insertRequest(input: AccessRequestInput): Promise<void> {
    await this.accessRequests.save(
      this.accessRequests.create({
        provider: input.provider,
        externalId: input.externalId,
        displayName: input.displayName,
        avatarUrl: input.avatarUrl,
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
    await this.accessRequests.save(existing);
  }
}
