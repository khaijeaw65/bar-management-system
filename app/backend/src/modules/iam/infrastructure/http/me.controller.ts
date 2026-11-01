import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MyPermissionsSchema, SetPinRequestSchema, type MyPermissions } from '@bar/contracts';
import { z } from 'zod';
import { AnyStaff } from '../../../../common/decorators/any-staff.decorator.js';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator.js';
import type { CurrentUserPayload } from '../../../../common/decorators/current-user.types.js';
import { ApiEnvelopedOk } from '../../../../common/openapi/api-enveloped.js';
import { zodToOpenApi } from '../../../../common/openapi/zod-to-openapi.js';
import { PermissionResolver } from '../../application/permission-resolver.service.js';
import { StaffPinService } from '../../application/staff-pin.service.js';

@ApiTags('me')
@Controller('me')
export class MeController {
  public constructor(
    private readonly resolver: PermissionResolver,
    private readonly staffPin: StaffPinService,
  ) {}

  @Get('permissions')
  @AnyStaff()
  @ApiOperation({
    summary: 'My effective permissions and groups',
    description: 'For hiding UI the caller cannot use. The server still enforces every route.',
  })
  @ApiEnvelopedOk(MyPermissionsSchema)
  public permissions(@CurrentUser() user: CurrentUserPayload): Promise<MyPermissions> {
    return this.resolver.accessFor(user.sub, new Date());
  }

  @Put('pin')
  @AnyStaff()
  @ApiOperation({
    summary: 'Set or change my POS PIN',
    description: '4 digits. currentPin required when a PIN exists. 409 PIN_UNAVAILABLE if taken by another staff.',
  })
  @ApiBody({ schema: zodToOpenApi(SetPinRequestSchema) })
  @ApiEnvelopedOk(z.object({ ok: z.literal(true) }))
  public async setPin(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ): Promise<{ ok: true }> {
    const parsed = SetPinRequestSchema.parse(body);
    return await this.staffPin.setPin(user.sub, parsed);
  }
}
