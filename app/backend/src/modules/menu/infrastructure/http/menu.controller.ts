import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  CreateMenuCategorySchema,
  MenuCategorySchema,
  OkSchema,
  ReorderMenuCategoriesSchema,
  UpdateMenuCategorySchema,
  type MenuCategory,
  type Ok,
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
import { ApiEnvelopedCreated, ApiEnvelopedOk } from '../../../../common/openapi/api-enveloped.js';
import { zodToOpenApi } from '../../../../common/openapi/zod-to-openapi.js';
import { MenuCatalogService } from '../../application/menu-catalog.service.js';
import { MenuWriteService } from '../../application/menu-write.service.js';
import { requireUuid, staffAccess } from '../../../../common/http/http-input.js';

@ApiTags('menu')
@Controller('menu')
export class MenuController {
  public constructor(
    private readonly menuCatalog: MenuCatalogService,
    private readonly menuWrite: MenuWriteService,
  ) {}

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

  @Post('categories')
  @RequirePermissions('menu:write')
  @ApiOperation({ summary: 'Add a category (last in order)', description: staffAccess('menu:write') })
  @ApiBody({ schema: zodToOpenApi(CreateMenuCategorySchema) })
  @ApiEnvelopedCreated(MenuCategorySchema)
  public createCategory(@Body() body: unknown): Promise<MenuCategory> {
    return this.menuWrite.createCategory(CreateMenuCategorySchema.parse(body));
  }

  @Put('categories/order')
  @RequirePermissions('menu:write')
  @ApiOperation({
    summary: 'Reorder categories',
    description: `${staffAccess('menu:write')} Every visible category exactly once; hidden ones may be left out and go last.`,
  })
  @ApiBody({ schema: zodToOpenApi(ReorderMenuCategoriesSchema) })
  @ApiEnvelopedOk(MenuCategoryListSchema)
  public reorderCategories(@Body() body: unknown): Promise<MenuCategoryList> {
    return this.menuWrite.reorderCategories(ReorderMenuCategoriesSchema.parse(body));
  }

  @Patch('categories/:id')
  @RequirePermissions('menu:write')
  @ApiOperation({
    summary: 'Rename or hide a category',
    description: `${staffAccess('menu:write')} A hidden category hides its items on every menu surface.`,
  })
  @ApiParam({ name: 'id', schema: zodToOpenApi(UuidSchema) })
  @ApiBody({ schema: zodToOpenApi(UpdateMenuCategorySchema) })
  @ApiEnvelopedOk(MenuCategorySchema)
  public updateCategory(@Param('id') id: string, @Body() body: unknown): Promise<MenuCategory> {
    return this.menuWrite.updateCategory(requireUuid(id, 'ไม่พบหมวด'), UpdateMenuCategorySchema.parse(body));
  }

  @Delete('categories/:id')
  @RequirePermissions('menu:write')
  @ApiOperation({
    summary: 'Delete an empty category',
    description: `${staffAccess('menu:write')} 409 CATEGORY_NOT_EMPTY while it holds any item.`,
  })
  @ApiParam({ name: 'id', schema: zodToOpenApi(UuidSchema) })
  @ApiEnvelopedOk(OkSchema)
  public deleteCategory(@Param('id') id: string): Promise<Ok> {
    return this.menuWrite.deleteCategory(requireUuid(id, 'ไม่พบหมวด'));
  }
}
