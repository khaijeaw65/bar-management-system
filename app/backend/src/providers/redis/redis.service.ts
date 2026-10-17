import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { RedisConfigService } from '../config/redis/config.service.js';

@Injectable()
export class RedisService implements OnModuleDestroy {
  public readonly client: Redis;

  public constructor(config: RedisConfigService) {
    this.client = new Redis(config.url, {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
      connectTimeout: 5_000,
    });
  }

  public async onModuleDestroy(): Promise<void> {
    if (this.client.status === 'wait' || this.client.status === 'end') {
      this.client.disconnect();
      return;
    }
    await this.client.quit();
  }
}
