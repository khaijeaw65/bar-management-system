import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  public constructor(private readonly configService: ConfigService) {}

  public get nodeEnv(): 'local' | 'test' | 'production' {
    return this.configService.getOrThrow('app.nodeEnv');
  }

  public get port(): number {
    return this.configService.getOrThrow('app.port');
  }

  public get frontendUrl(): string {
    return this.configService.getOrThrow('app.frontendUrl');
  }
}
