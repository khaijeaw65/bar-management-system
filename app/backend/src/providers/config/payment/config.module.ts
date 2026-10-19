import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import paymentConfiguration from './configuration.js';
import { PaymentConfigService } from './config.service.js';

@Module({
  imports: [ConfigModule.forFeature(paymentConfiguration)],
  providers: [PaymentConfigService],
  exports: [PaymentConfigService],
})
export class PaymentConfigModule {}
