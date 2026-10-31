import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CLOCK } from '../../common/clock.js';
import { SystemClock } from '../../common/system-clock.js';
import { AuthModule } from '../auth/auth.module.js';
import { IamModule } from '../iam/iam.module.js';
import { NotificationEntity } from './entities/notification.entity.js';
import { NotificationRecipients } from './application/notification-recipients.js';
import { NotificationsService } from './notifications.service.js';
import { NotificationsGateway } from './notifications.gateway.js';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity]),
    AuthModule,
    IamModule,
  ],
  providers: [
    NotificationsGateway,
    NotificationsService,
    NotificationRecipients,
    { provide: CLOCK, useClass: SystemClock },
  ],
  exports: [NotificationsService, NotificationRecipients],
})
export class NotificationsModule {}
