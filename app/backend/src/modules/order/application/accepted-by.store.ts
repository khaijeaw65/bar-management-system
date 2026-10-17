import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../providers/redis/redis.service.js';

// ponytail: Redis stands in for an accepted_by column. updated_by is overwritten on ready/send.
// Ceiling: add the column when a later brief owns the schema change.
const PREFIX = 'order:accepted-by:';

@Injectable()
export class AcceptedByStore {
  public constructor(private readonly redis: RedisService) {}

  public async remember(ticketId: string, staffId: string): Promise<void> {
    await this.redis.client.set(`${PREFIX}${ticketId}`, staffId);
  }

  public async lookup(ticketIds: readonly string[]): Promise<Map<string, string>> {
    if (ticketIds.length === 0) return new Map();
    const values = await this.redis.client.mget(ticketIds.map((id) => `${PREFIX}${id}`));
    return pairs(ticketIds, values);
  }
}

function pairs(ids: readonly string[], values: Array<string | null>): Map<string, string> {
  const found = new Map<string, string>();
  ids.forEach((id, index) => {
    const value = values[index];
    if (value) found.set(id, value);
  });
  return found;
}
