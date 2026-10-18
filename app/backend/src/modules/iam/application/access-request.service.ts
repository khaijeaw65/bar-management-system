import { Inject, Injectable } from '@nestjs/common';
import {
  ACCESS_REQUEST_REPOSITORY,
  type AccessRequestRepository,
} from '../domain/access-request.repository.js';
import type { AccessRequestInput } from '../domain/access-request.types.js';

@Injectable()
export class AccessRequestService {
  public constructor(
    @Inject(ACCESS_REQUEST_REPOSITORY)
    private readonly accessRequests: AccessRequestRepository,
  ) {}

  public recordRequest(input: AccessRequestInput): Promise<void> {
    return this.accessRequests.recordPending(input);
  }
}
