import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisConfigService {
  public constructor(private readonly configService: ConfigService) {}

  public get url(): string {
    return this.configService.getOrThrow('redis.url');
  }
}
