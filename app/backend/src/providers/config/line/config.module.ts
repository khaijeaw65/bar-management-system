import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import lineConfiguration from './configuration.js';
import { LineConfigService } from './config.service.js';

@Module({
  imports: [ConfigModule.forFeature(lineConfiguration)],
  providers: [LineConfigService],
  exports: [LineConfigService],
})
export class LineConfigModule {}
