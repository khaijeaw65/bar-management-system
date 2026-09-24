import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfiguration from './configuration.js';
import { AppConfigService } from './config.service.js';

@Module({
  imports: [ConfigModule.forFeature(appConfiguration)],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
