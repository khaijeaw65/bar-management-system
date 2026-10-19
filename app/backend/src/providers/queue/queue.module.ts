import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RedisConfigModule } from '../config/redis/config.module.js';
import { RedisConfigService } from '../config/redis/config.service.js';
import { bullConnection } from './bull-connection.js';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [RedisConfigModule],
      inject: [RedisConfigService],
      useFactory: (redis: RedisConfigService) => ({
        connection: bullConnection(redis.url),
      }),
    }),
  ],
})
export class QueueModule {}
