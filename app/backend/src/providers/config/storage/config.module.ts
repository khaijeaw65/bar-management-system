import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import storageConfiguration from './configuration.js';
import { StorageConfigService } from './config.service.js';

@Module({
  imports: [ConfigModule.forFeature(storageConfiguration)],
  providers: [StorageConfigService],
  exports: [StorageConfigService],
})
export class StorageConfigModule {}
