import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EasySlipConfigService {
  public constructor(private readonly configService: ConfigService) {}

  public get apiKey(): string {
    return this.configService.get('easyslip.apiKey') ?? '';
  }

  public get baseUrl(): string {
    return this.configService.getOrThrow('easyslip.baseUrl');
  }
}
