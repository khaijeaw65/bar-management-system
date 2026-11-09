import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { StorageCredentials } from './config.types.js';

@Injectable()
export class StorageConfigService {
  public constructor(private readonly configService: ConfigService) {}

  public get region(): string {
    return this.configService.getOrThrow('storage.region');
  }

  public get bucket(): string {
    return this.configService.getOrThrow('storage.bucket');
  }

  /** Both keys or neither: a lone key is ignored and the default credential chain applies. */
  public get credentials(): StorageCredentials | undefined {
    const accessKeyId = this.configService.get<string>('storage.accessKeyId');
    const secretAccessKey = this.configService.get<string>('storage.secretAccessKey');
    return accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined;
  }
}
