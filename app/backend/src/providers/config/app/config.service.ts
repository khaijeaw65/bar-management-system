import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get nodeEnv(): 'local' | 'test' | 'production' {
    return this.configService.getOrThrow('app.nodeEnv');
  }

  get port(): number {
    return this.configService.getOrThrow('app.port');
  }
}
