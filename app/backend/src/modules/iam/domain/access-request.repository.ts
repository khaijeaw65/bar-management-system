import type { AccessRequestInput } from './access-request.types.js';

export interface AccessRequestRepository {
  recordPending(input: AccessRequestInput): Promise<void>;
}

export const ACCESS_REQUEST_REPOSITORY = Symbol('ACCESS_REQUEST_REPOSITORY');
