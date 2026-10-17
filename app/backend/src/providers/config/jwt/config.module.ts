import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import jwtConfiguration from './configuration.js';
import { JwtConfigService } from './config.service.js';

@Module({
  imports: [ConfigModule.forFeature(jwtConfiguration)],
  providers: [JwtConfigService],
  exports: [JwtConfigService],
})
export class JwtConfigModule {}
