import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OpenApiConfigService {
  public constructor(private readonly configService: ConfigService) {}

  public get enabled(): boolean {
    return this.configService.getOrThrow('openapi.enabled');
  }
}
