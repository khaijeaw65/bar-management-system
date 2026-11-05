import { Injectable } from '@nestjs/common';
import { AccessRequestRepository } from '../domain/access-request.repository.js';
import type { AccessRequestInput } from '../domain/access-request.types.js';

@Injectable()
export class AccessRequestService {
  public constructor(
    private readonly accessRequests: AccessRequestRepository,
  ) {}

  public recordRequest(input: AccessRequestInput): Promise<void> {
    return this.accessRequests.recordPending(input);
  }
}
