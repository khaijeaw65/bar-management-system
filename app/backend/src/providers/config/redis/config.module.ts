import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import redisConfiguration from './configuration.js';
import { RedisConfigService } from './config.service.js';

@Module({
  imports: [ConfigModule.forFeature(redisConfiguration)],
  providers: [RedisConfigService],
  exports: [RedisConfigService],
})
export class RedisConfigModule {}
