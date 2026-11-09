import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Clock } from '../../common/clock.js';
import { SystemClock } from '../../common/system-clock.js';
import { AuthModule } from '../auth/auth.module.js';
import { IamModule } from '../iam/iam.module.js';
import { ExpoConfigModule } from '../../providers/config/expo/config.module.js';
import { NotificationRepository } from './domain/ports/notification.repository.port.js';
import { NotificationEntity } from './infrastructure/persistence/notification.entity.js';
import { NotificationTypeOrmRepository } from './infrastructure/persistence/notification.typeorm-repository.js';
import { StaffPushTokenEntity } from './infrastructure/persistence/staff-push-token.entity.js';
import { PushSender } from './application/ports/push-sender.port.js';
import { StaffPushTokenRepository } from './application/ports/staff-push-token.repository.port.js';
import { StaffPushTokenTypeormRepository } from './infrastructure/persistence/staff-push-token.typeorm-repository.js';
import { PushDeliveryService } from './application/push-delivery.service.js';
import { NOTIFICATION_PUSH_QUEUE } from './application/push.types.js';
import { NotificationPushProcessor } from './infrastructure/queue/notification-push.processor.js';
import { PushTokenService } from './application/push-token.service.js';
import { ExpoPushSenderAdapter } from './infrastructure/push/expo-push-sender.adapter.js';
import { NotificationRecipients } from './application/notification-recipients.js';
import { NotificationsService } from './notifications.service.js';
import { NotificationsGateway } from './notifications.gateway.js';
import { NotificationsController } from './infrastructure/http/notifications.controller.js';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity, StaffPushTokenEntity]),
    BullModule.registerQueue({ name: NOTIFICATION_PUSH_QUEUE }),
    ExpoConfigModule,
    AuthModule,
    IamModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsGateway,
    NotificationsService,
    NotificationRecipients,
    PushTokenService,
    PushDeliveryService,
    NotificationPushProcessor,
    NotificationTypeOrmRepository,
    { provide: NotificationRepository, useExisting: NotificationTypeOrmRepository },
    StaffPushTokenTypeormRepository,
    { provide: StaffPushTokenRepository, useExisting: StaffPushTokenTypeormRepository },
    ExpoPushSenderAdapter,
    { provide: PushSender, useExisting: ExpoPushSenderAdapter },
    { provide: Clock, useClass: SystemClock },
  ],
  exports: [NotificationsService, NotificationRecipients],
})
export class NotificationsModule {}
