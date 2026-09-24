import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import databaseConfiguration from './configuration.js';
import { DatabaseConfigService } from './config.service.js';

@Module({
  imports: [ConfigModule.forFeature(databaseConfiguration)],
  providers: [DatabaseConfigService],
  exports: [DatabaseConfigService],
})
export class DatabaseConfigModule {}
