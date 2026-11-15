import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import expoConfiguration from './configuration.js';
import { ExpoConfigService } from './config.service.js';

@Module({
  imports: [ConfigModule.forFeature(expoConfiguration)],
  providers: [ExpoConfigService],
  exports: [ExpoConfigService],
})
export class ExpoConfigModule {}
