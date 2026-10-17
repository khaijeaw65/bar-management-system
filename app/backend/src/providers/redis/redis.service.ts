import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { Redis } from 'ioredis';
import { RedisConfigService } from '../config/redis/config.service.js';

@Injectable()
export class RedisService implements OnApplicationShutdown {
  public readonly client: Redis;
  private readonly subscribers: Redis[] = [];

  public constructor(config: RedisConfigService) {
    this.client = new Redis(config.url, {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
      connectTimeout: 5_000,
    });
  }

  public createSubscriber(): Redis {
    const subscriber = this.client.duplicate();
    this.subscribers.push(subscriber);
    return subscriber;
  }

  // After the socket adapter unsubscribes. Quitting earlier rejects its close.
  public async onApplicationShutdown(): Promise<void> {
    await Promise.all(this.subscribers.map((client) => this.closeRedis(client)));
    await this.closeRedis(this.client);
  }

  private async closeRedis(client: Redis): Promise<void> {
    if (client.status === 'wait' || client.status === 'end') {
      client.disconnect();
      return;
    }
    await client.quit();
  }
}
