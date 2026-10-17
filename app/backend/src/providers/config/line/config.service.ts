import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LineConfigService {
  constructor(private readonly configService: ConfigService) {}

  get channelId(): string {
    return this.configService.getOrThrow('line.channelId');
  }

  get channelSecret(): string {
    return this.configService.getOrThrow('line.channelSecret');
  }

  get callbackUrl(): string {
    return this.configService.getOrThrow('line.callbackUrl');
  }
}
