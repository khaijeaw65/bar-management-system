import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Put, Query } from '@nestjs/common';
import { ApiBody, ApiNoContentResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  NotificationPageSchema,
  NotificationSchema,
  OkSchema,
  ReadAllResultSchema,
  RegisterPushTokenSchema,
  UnreadCountSchema,
  UuidSchema,
  type Notification,
  type NotificationPage,
  type Ok,
  type ReadAllResult,
  type UnreadCount,
} from '@bar/contracts';
import { AnyStaff } from '../../../../common/decorators/any-staff.decorator.js';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator.js';
import type { CurrentUserPayload } from '../../../../common/decorators/current-user.types.js';
import { requireUuid } from '../../../../common/http/http-input.js';
import { ApiEnvelopedOk } from '../../../../common/openapi/api-enveloped.js';
import { zodToOpenApi } from '../../../../common/openapi/zod-to-openapi.js';
import { PushTokenService } from '../../application/push-token.service.js';
import { NotificationsService } from '../../notifications.service.js';

const NOT_FOUND = 'ไม่พบการแจ้งเตือน';
const ACCESS_DESC = 'any active staff; own rows only';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  public constructor(
    private readonly notifications: NotificationsService,
    private readonly pushTokens: PushTokenService,
  ) {}

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

  @Put('push-tokens')
  @AnyStaff()
  @ApiOperation({
    summary: 'Register this phone for push (upsert; a token held by another staff member moves to the caller)',
    description: 'any active staff; 400 VALIDATION_ERROR when the token is not an Expo push token',
  })
  @ApiBody({ schema: zodToOpenApi(RegisterPushTokenSchema) })
  @ApiEnvelopedOk(OkSchema)
  public async registerPushToken(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ): Promise<Ok> {
    return await this.pushTokens.register(user.sub, RegisterPushTokenSchema.parse(body));
  }

  @Delete('push-tokens/:token')
  @HttpCode(204)
  @AnyStaff()
  @ApiOperation({
    summary: 'Unregister this phone (call before logout)',
    description: 'any active staff; own token only; unknown or foreign token → 204 (idempotent)',
  })
  @ApiParam({ name: 'token' })
  @ApiNoContentResponse({ description: 'Token removed or already absent' })
  public async unregisterPushToken(
    @CurrentUser() user: CurrentUserPayload,
    @Param('token') token: string,
  ): Promise<void> {
    await this.pushTokens.unregister(user.sub, token);
  }
}
