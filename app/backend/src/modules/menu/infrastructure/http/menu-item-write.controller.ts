import { Body, Controller, Headers, Param, Patch, Post } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  CreateMenuItemSchema,
  MenuItemSchema,
  UpdateMenuItemSchema,
  UuidSchema,
  type CreateMenuItem,
  type MenuItem,
} from '@bar/contracts';
import { RequirePermissions } from '../../../../common/decorators/require-permissions.decorator.js';
import { requireUuid, staffAccess } from '../../../../common/http/http-input.js';
import { idempotencyKey } from '../../../../common/idempotency/idempotency-key.js';
import { IdempotencyService } from '../../../../common/idempotency/idempotency.service.js';
import { requestHash } from '../../../../common/idempotency/request-hash.js';
import { ApiEnvelopedCreated, ApiEnvelopedOk } from '../../../../common/openapi/api-enveloped.js';
import { zodToOpenApi } from '../../../../common/openapi/zod-to-openapi.js';
import { MenuWriteService } from '../../application/menu-write.service.js';

const SCOPE = 'menu-item';

@ApiTags('menu')
@Controller('menu/items')
export class MenuItemWriteController {
  public constructor(
    private readonly menuWrite: MenuWriteService,
    private readonly idempotency: IdempotencyService,
  ) {}

  @Post()
  @RequirePermissions('menu:write')
  @ApiOperation({
    summary: 'Add a menu item with its price options',
    description: `${staffAccess('menu:write')} Optional Idempotency-Key (DR-017): a replay returns the same item.`,
  })
  @ApiHeader({ name: 'Idempotency-Key', required: false, schema: zodToOpenApi(UuidSchema) })
  @ApiBody({ schema: zodToOpenApi(CreateMenuItemSchema) })
  @ApiEnvelopedCreated(MenuItemSchema)
  public async create(
    @Body() body: unknown,
    @Headers('idempotency-key') header: string | undefined,
  ): Promise<MenuItem> {
    const parsed = CreateMenuItemSchema.parse(body);
    const key = idempotencyKey(header);
    const hash = requestHash(parsed);
    const gate = await this.idempotency.begin<MenuItem>({ scope: SCOPE, key, hash });
    if (gate.kind === 'replay') return gate.body;
    return this.createNew(parsed, key, hash);
  }

  @Patch(':id')
  @RequirePermissions('menu:write')
  @ApiOperation({
    summary: 'Edit a menu item (whole form)',
    description:
      `${staffAccess('menu:write')} Send the updatedAt you loaded; an older one → 409 MENU_ITEM_STALE with the current item. ` +
      'Variants are the new active set: listed ids are kept, new ones added, missing ones deactivated (never deleted). ' +
      'Existing order lines keep their snapshot price.',
  })
  @ApiParam({ name: 'id', schema: zodToOpenApi(UuidSchema) })
  @ApiBody({ schema: zodToOpenApi(UpdateMenuItemSchema) })
  @ApiEnvelopedOk(MenuItemSchema)
  public update(@Param('id') id: string, @Body() body: unknown): Promise<MenuItem> {
    return this.menuWrite.updateItem(requireUuid(id, 'ไม่พบเมนู'), UpdateMenuItemSchema.parse(body));
  }

  private async createNew(parsed: CreateMenuItem, key: string | null, hash: string): Promise<MenuItem> {
    try {
      const item = await this.menuWrite.createItem(parsed);
      await this.idempotency.finish({ scope: SCOPE, key, hash, body: item });
      return item;
    } catch (error) {
      await this.idempotency.cancel(SCOPE, key);
      throw error;
    }
  }
}
