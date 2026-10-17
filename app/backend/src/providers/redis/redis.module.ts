import { Global, Module } from '@nestjs/common';
import { RedisConfigModule } from '../config/redis/config.module.js';
import { RedisService } from './redis.service.js';

@Global()
@Module({
  imports: [RedisConfigModule],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
