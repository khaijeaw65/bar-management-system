import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ClsUserInterceptor } from './common/interceptors/cls-user.interceptor.js';
import { HealthModule } from './modules/health/health.module.js';
import { AppConfigModule } from './providers/config/app/config.module.js';
import { DatabaseConfigModule } from './providers/config/database/config.module.js';
import { DatabaseModule } from './providers/database/database.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AppConfigModule,
    DatabaseConfigModule,
    DatabaseModule,
    HealthModule,
  ],
  providers: [{ provide: APP_INTERCEPTOR, useClass: ClsUserInterceptor }],
})
export class AppModule {}
