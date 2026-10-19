import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentConfigService {
  public constructor(private readonly configService: ConfigService) {}

  public get qrTtlSeconds(): number {
    return this.configService.getOrThrow('payment.qrTtlSeconds');
  }
}
