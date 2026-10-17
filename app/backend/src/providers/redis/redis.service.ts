import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { RedisConfigService } from '../config/redis/config.service.js';

@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client: Redis;

  constructor(config: RedisConfigService) {
    this.client = new Redis(config.url, {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
      connectTimeout: 5_000,
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.status === 'wait' || this.client.status === 'end') {
      this.client.disconnect();
      return;
    }
    await this.client.quit();
  }
}
