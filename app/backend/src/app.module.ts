import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ClsUserInterceptor } from './common/interceptors/cls-user.interceptor.js';
import { HealthModule } from './modules/health/health.module.js';
import { AppConfigModule } from './providers/config/config.module.js';
import { OrmModule } from './providers/orm/typeorm.module.js';

@Module({
  imports: [AppConfigModule, OrmModule, HealthModule],
  providers: [{ provide: APP_INTERCEPTOR, useClass: ClsUserInterceptor }],
})
export class AppModule {}
