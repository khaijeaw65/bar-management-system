import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StaffAccessRequest } from '../infrastructure/persistence/staff-access-request.entity.js';
import type { AccessRequestInput } from './access-request.types.js';

@Injectable()
export class AccessRequestService {
  public constructor(
    @InjectRepository(StaffAccessRequest)
    private readonly accessRequestRepository: Repository<StaffAccessRequest>,
  ) {}

  public async recordRequest(input: AccessRequestInput): Promise<void> {
    const existing = await this.accessRequestRepository.findOne({
      where: { provider: input.provider, externalId: input.externalId },
    });
    if (!existing) {
      await this.insertRequest(input);
      return;
    }
    await this.updateRequest(existing, input.displayName, input.avatarUrl);
  }

  private async insertRequest(input: AccessRequestInput): Promise<void> {
    await this.accessRequestRepository.save(
      this.accessRequestRepository.create({
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
    await this.accessRequestRepository.save(existing);
  }
}
