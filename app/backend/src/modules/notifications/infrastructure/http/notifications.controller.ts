import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  NotificationPageSchema,
  NotificationSchema,
  ReadAllResultSchema,
  UnreadCountSchema,
  UuidSchema,
  type Notification,
  type NotificationPage,
  type ReadAllResult,
  type UnreadCount,
} from '@bar/contracts';
import { AnyStaff } from '../../../../common/decorators/any-staff.decorator.js';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator.js';
import type { CurrentUserPayload } from '../../../../common/decorators/current-user.types.js';
import { requireUuid } from '../../../../common/http/http-input.js';
import { ApiEnvelopedOk } from '../../../../common/openapi/api-enveloped.js';
import { zodToOpenApi } from '../../../../common/openapi/zod-to-openapi.js';
import { NotificationsService } from '../../notifications.service.js';

const NOT_FOUND = 'ไม่พบการแจ้งเตือน';
const ACCESS_DESC = 'any active staff; own rows only';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  public constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @AnyStaff()
  @ApiOperation({
    summary: 'Paginated notifications for the authenticated staff user',
    description: ACCESS_DESC,
  })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiEnvelopedOk(NotificationPageSchema)
  public async feed(
    @CurrentUser() user: CurrentUserPayload,
    @Query('cursor') cursor?: string,
  ): Promise<NotificationPage> {
    return await this.notifications.feed(user.sub, cursor);
  }

  @Get('unread-count')
  @AnyStaff()
  @ApiOperation({
    summary: 'Count of unread notifications for the authenticated staff user',
    description: ACCESS_DESC,
  })
  @ApiEnvelopedOk(UnreadCountSchema)
  public async unreadCount(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<UnreadCount> {
    const count = await this.notifications.unreadCount(user.sub);
    return { count };
  }

  @Patch(':id/read')
  @AnyStaff()
  @ApiOperation({
    summary: 'Mark a single notification as read',
    description: ACCESS_DESC,
  })
  @ApiParam({ name: 'id', schema: zodToOpenApi(UuidSchema) })
  @ApiEnvelopedOk(NotificationSchema)
  public async markAsRead(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ): Promise<Notification> {
    const notificationId = requireUuid(id, NOT_FOUND);
    return await this.notifications.markAsRead(user.sub, notificationId);
  }

  @Patch('read-all')
  @AnyStaff()
  @ApiOperation({
    summary: 'Mark all notifications as read for the authenticated staff user',
    description: ACCESS_DESC,
  })
  @ApiEnvelopedOk(ReadAllResultSchema)
  public async markAllAsRead(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ReadAllResult> {
    const updated = await this.notifications.markAllAsRead(user.sub);
    return { updated };
  }
}
