import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LineConfigService {
  public constructor(private readonly configService: ConfigService) {}

  public get channelId(): string {
    return this.configService.getOrThrow('line.channelId');
  }

  public get channelSecret(): string {
    return this.configService.getOrThrow('line.channelSecret');
  }

  public get callbackUrl(): string {
    return this.configService.getOrThrow('line.callbackUrl');
  }
}
