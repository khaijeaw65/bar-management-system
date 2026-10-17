import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  MenuCategoryListSchema,
  MenuItemListSchema,
  MenuItemSchema,
  MenuItemsQuerySchema,
  UuidSchema,
  type MenuCategoryList,
  type MenuItem,
  type MenuItemList,
} from '@bar/contracts';
import { RequirePermissions } from '../../../../common/decorators/require-permissions.decorator.js';
import { ApiEnvelopedOk } from '../../../../common/openapi/api-enveloped.js';
import { zodToOpenApi } from '../../../../common/openapi/zod-to-openapi.js';
import { MenuCatalogService } from '../../application/menu-catalog.service.js';
import { requireUuid, staffAccess } from './http-input.js';

@ApiTags('menu')
@Controller('menu')
export class MenuController {
  public constructor(private readonly menuCatalog: MenuCatalogService) {}

  @Get('categories')
  @RequirePermissions('menu:read')
  @ApiOperation({
    summary: 'Active menu categories',
    description: staffAccess('menu:read'),
  })
  @ApiEnvelopedOk(MenuCategoryListSchema)
  public listCategories(): Promise<MenuCategoryList> {
    return this.menuCatalog.listCategories();
  }

  @Get('items')
  @RequirePermissions('menu:read')
  @ApiOperation({
    summary: 'Menu items with variants, modifiers, and live availability',
    description: staffAccess('menu:read'),
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    schema: zodToOpenApi(UuidSchema),
  })
  @ApiQuery({
    name: 'available',
    required: false,
    schema: { type: 'string', enum: ['true'] },
    description: 'When true, only items available now',
  })
  @ApiEnvelopedOk(MenuItemListSchema)
  public listItems(@Query() query: unknown): Promise<MenuItemList> {
    const parsed = MenuItemsQuerySchema.parse(query);
    return this.menuCatalog.listItems({
      categoryId: parsed.categoryId,
      availableOnly: parsed.available === 'true',
    });
  }

  @Get('items/:id')
  @RequirePermissions('menu:read')
  @ApiOperation({
    summary: 'One menu item',
    description: staffAccess('menu:read'),
  })
  @ApiParam({ name: 'id', schema: zodToOpenApi(UuidSchema) })
  @ApiEnvelopedOk(MenuItemSchema)
  public getItem(@Param('id') id: string): Promise<MenuItem> {
    return this.menuCatalog.getItem(requireUuid(id, 'ไม่พบเมนู'));
  }
}
