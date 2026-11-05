import type { AccessRequestInput } from './access-request.types.js';

export abstract class AccessRequestRepository {
  public abstract recordPending(input: AccessRequestInput): Promise<void>;
}
