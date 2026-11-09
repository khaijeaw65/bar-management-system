import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  PermissionCatalogSchema,
  type PermissionCatalog,
} from '@bar/contracts';
import { RequirePermissions } from '../../../../common/decorators/require-permissions.decorator.js';
import { staffAccess } from '../../../../common/http/http-input.js';
import { ApiEnvelopedOk } from '../../../../common/openapi/api-enveloped.js';
import { IamAdminService } from '../../application/iam-admin.service.js';

const ACCESS = staffAccess('staff:manage');

@ApiTags('staff')
@Controller('permissions')
export class PermissionCatalogController {
  public constructor(private readonly iamAdmin: IamAdminService) {}

  @Get('catalog')
  @RequirePermissions('staff:manage')
  @ApiOperation({
    summary: 'Every permission code, grouped by resource, with Thai labels',
    description: `${ACCESS} The rows and switches of the policy matrix.`,
  })
  @ApiEnvelopedOk(PermissionCatalogSchema)
  public catalog(): PermissionCatalog {
    return this.iamAdmin.catalog();
  }
}
