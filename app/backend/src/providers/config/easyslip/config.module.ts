import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import easyslipConfiguration from './configuration.js';
import { EasySlipConfigService } from './config.service.js';

@Module({
  imports: [ConfigModule.forFeature(easyslipConfiguration)],
  providers: [EasySlipConfigService],
  exports: [EasySlipConfigService],
})
export class EasySlipConfigModule {}
