import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from './common/guards/permissions.guard.js';
import { ClsUserInterceptor } from './common/interceptors/cls-user.interceptor.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { IamModule } from './modules/iam/iam.module.js';
import { StaffAdminModule } from './modules/iam/staff-admin.module.js';
import { CustomerModule } from './modules/customer/customer.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { MenuModule } from './modules/menu/menu.module.js';
import { OrderModule } from './modules/order/order.module.js';
import { PaymentModule } from './modules/payment/payment.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { ReportsModule } from './modules/reports/reports.module.js';
import { VenueModule } from './modules/venue/venue.module.js';
import { AppConfigModule } from './providers/config/app/config.module.js';
import { DatabaseConfigModule } from './providers/config/database/config.module.js';
import { OpenApiConfigModule } from './providers/config/openapi/config.module.js';
import { DatabaseModule } from './providers/database/database.module.js';
import { QueueModule } from './providers/queue/queue.module.js';
import { RedisModule } from './providers/redis/redis.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AppConfigModule,
    OpenApiConfigModule,
    DatabaseConfigModule,
    RedisModule,
    QueueModule,
    DatabaseModule,
    AuthModule,
    IamModule,
    StaffAdminModule,
    NotificationsModule,
    VenueModule,
    MenuModule,
    OrderModule,
    PaymentModule,
    ReportsModule,
    CustomerModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: ClsUserInterceptor },
    // Order matters: authenticate first, then authorise.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
