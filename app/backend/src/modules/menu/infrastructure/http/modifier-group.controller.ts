import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  CreateModifierGroupSchema,
  ModifierGroupAdminListSchema,
  ModifierGroupAdminSchema,
  OkSchema,
  UpdateModifierGroupSchema,
  UuidSchema,
  type ModifierGroupAdmin,
  type ModifierGroupAdminList,
  type Ok,
} from '@bar/contracts';
import { RequirePermissions } from '../../../../common/decorators/require-permissions.decorator.js';
import { requireUuid, staffAccess } from '../../../../common/http/http-input.js';
import { ApiEnvelopedCreated, ApiEnvelopedOk } from '../../../../common/openapi/api-enveloped.js';
import { zodToOpenApi } from '../../../../common/openapi/zod-to-openapi.js';
import { ModifierGroupService } from '../../application/modifier-group.service.js';

const NOT_FOUND = 'ไม่พบกลุ่มตัวเลือก';

@ApiTags('menu')
@Controller('menu/modifier-groups')
export class ModifierGroupController {
  public constructor(private readonly modifierGroups: ModifierGroupService) {}

  @Get()
  @RequirePermissions('menu:read')
  @ApiOperation({
    summary: 'Add-on groups with their options',
    description:
      `${staffAccess('menu:read')} Active groups by name; options include switched-off ones (\`isAvailable: false\`). ` +
      '`usedByItems` = menu items whose active variants link the group.',
  })
  @ApiEnvelopedOk(ModifierGroupAdminListSchema)
  public list(): Promise<ModifierGroupAdminList> {
    return this.modifierGroups.list();
  }

  @Post()
  @RequirePermissions('menu:write')
  @ApiOperation({ summary: 'Add an add-on group with its options', description: staffAccess('menu:write') })
  @ApiBody({ schema: zodToOpenApi(CreateModifierGroupSchema) })
  @ApiEnvelopedCreated(ModifierGroupAdminSchema)
  public create(@Body() body: unknown): Promise<ModifierGroupAdmin> {
    return this.modifierGroups.create(CreateModifierGroupSchema.parse(body));
  }

  @Patch(':id')
  @RequirePermissions('menu:write')
  @ApiOperation({
    summary: 'Edit an add-on group (whole form)',
    description:
      `${staffAccess('menu:write')} \`options\` is the new active set: listed ids are updated and re-activated, new ones added, ` +
      'missing ones switched off (`isAvailable: false`, never deleted). Switched-off options can no longer be ordered; ' +
      'existing order lines keep their name and price. An option id of another group → 400. Last write wins (no stale check).',
  })
  @ApiParam({ name: 'id', schema: zodToOpenApi(UuidSchema) })
  @ApiBody({ schema: zodToOpenApi(UpdateModifierGroupSchema) })
  @ApiEnvelopedOk(ModifierGroupAdminSchema)
  public update(@Param('id') id: string, @Body() body: unknown): Promise<ModifierGroupAdmin> {
    return this.modifierGroups.update(requireUuid(id, NOT_FOUND), UpdateModifierGroupSchema.parse(body));
  }

  @Delete(':id')
  @RequirePermissions('menu:write')
  @ApiOperation({
    summary: 'Remove an add-on group no menu uses',
    description:
      `${staffAccess('menu:write')} Archives the group (DR-024) — rows stay for old orders; there is no restore. ` +
      '409 MODIFIER_GROUP_IN_USE while any menu item links it; archived or unknown → 404.',
  })
  @ApiParam({ name: 'id', schema: zodToOpenApi(UuidSchema) })
  @ApiEnvelopedOk(OkSchema)
  public archive(@Param('id') id: string): Promise<Ok> {
    return this.modifierGroups.archive(requireUuid(id, NOT_FOUND));
  }
}
