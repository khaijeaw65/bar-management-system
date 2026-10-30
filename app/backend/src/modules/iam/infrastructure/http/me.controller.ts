import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MyPermissionsSchema, type MyPermissions } from '@bar/contracts';
import { AnyStaff } from '../../../../common/decorators/any-staff.decorator.js';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator.js';
import type { CurrentUserPayload } from '../../../../common/decorators/current-user.types.js';
import { ApiEnvelopedOk } from '../../../../common/openapi/api-enveloped.js';
import { PermissionResolver } from '../../application/permission-resolver.service.js';

@ApiTags('me')
@Controller('me')
export class MeController {
  public constructor(private readonly resolver: PermissionResolver) {}

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
}
