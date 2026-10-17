import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import openApiConfiguration from './configuration.js';
import { OpenApiConfigService } from './config.service.js';

@Module({
  imports: [ConfigModule.forFeature(openApiConfiguration)],
  providers: [OpenApiConfigService],
  exports: [OpenApiConfigService],
})
export class OpenApiConfigModule {}
