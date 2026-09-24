import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { ClsModule } from 'nestjs-cls';
import { DataSource } from 'typeorm';
import { AppConfigModule } from '../config/app/config.module.js';
import { AppConfigService } from '../config/app/config.service.js';
import { DatabaseConfigModule } from '../config/database/config.module.js';
import { DatabaseConfigService } from '../config/database/config.service.js';
import { databaseOptions } from './database-options.js';
import { migrations } from './migrations.js';
import { AuditSubscriber } from './subscribers/audit.subscriber.js';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule, DatabaseConfigModule],
      inject: [DatabaseConfigService, AppConfigService],
      useFactory: (database: DatabaseConfigService, app: AppConfigService) => ({
        ...databaseOptions({
          host: database.host,
          port: database.port,
          username: database.username,
          password: database.password,
          database: database.database,
          nodeEnv: app.nodeEnv,
        }),
        autoLoadEntities: true,
        migrations,
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
  providers: [AuditSubscriber],
})
export class DatabaseModule {}
