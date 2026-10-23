import { Module } from '@nestjs/common';
import { StorageConfigModule } from '../../providers/config/storage/config.module.js';
import { StorageService } from './storage.service.js';

@Module({
  imports: [StorageConfigModule],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
