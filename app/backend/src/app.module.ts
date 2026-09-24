import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { ClsModule } from 'nestjs-cls';
import { DataSource } from 'typeorm';
import { ClsUserInterceptor } from './common/interceptors/cls-user.interceptor.js';
import { AuditSubscriber } from './common/subscribers/audit.subscriber.js';
import { appConfig } from './config/app.config.js';
import { databaseConfig } from './config/database.config.js';
import { validateEnv } from './config/env.schema.js';
import { InitExtensions1758662400000 } from './database/migrations/1758662400000-InitExtensions.js';
import { HealthController } from './health/health.controller.js';
import { HealthService } from './health/health.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      load: [appConfig, databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [databaseConfig.KEY],
      useFactory: (database: ReturnType<typeof databaseConfig>) => ({
        ...database,
        autoLoadEntities: true,
        migrations: [InitExtensions1758662400000],
      }),
    }),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
      plugins: [
        new ClsPluginTransactional({
          imports: [TypeOrmModule],
          adapter: new TransactionalAdapterTypeOrm({
            dataSourceToken: DataSource,
          }),
        }),
      ],
    }),
  ],
  controllers: [HealthController],
  providers: [
    HealthService,
    AuditSubscriber,
    { provide: APP_INTERCEPTOR, useClass: ClsUserInterceptor },
  ],
})
export class AppModule {}
