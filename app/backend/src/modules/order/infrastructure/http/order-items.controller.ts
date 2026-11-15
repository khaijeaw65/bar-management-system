import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import {
  AdjustItemRequestSchema,
  OrderLineSchema,
  UuidSchema,
  type AdjustItemRequest,
  type OrderLine,
} from '@bar/contracts';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator.js';
import type { CurrentUserPayload } from '../../../../common/decorators/current-user.types.js';
import { RequirePermissions } from '../../../../common/decorators/require-permissions.decorator.js';
import { requireUuid, staffAccess } from '../../../../common/http/http-input.js';
import { ApiEnvelopedOk } from '../../../../common/openapi/api-enveloped.js';
import { zodToOpenApi } from '../../../../common/openapi/zod-to-openapi.js';
import { OrderAdjustmentService } from '../../application/order-adjustment.service.js';

@Controller('order-items')
export class OrderItemsController {
  public constructor(
    private readonly adjustment: OrderAdjustmentService,
  ) {}

  @Post(':id/void')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('orders:update_status')
  @ApiOperation({
    summary: 'Void an order item line (requires manager PIN or orders:void permission)',
    description: staffAccess('orders:update_status'),
  })
  @ApiParam({ name: 'id', schema: zodToOpenApi(UuidSchema) })
  @ApiBody({ schema: zodToOpenApi(AdjustItemRequestSchema) })
  @ApiEnvelopedOk(OrderLineSchema)
  public async voidLine(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<OrderLine> {
    const itemId = requireUuid(id, 'ไม่พบรายการ');
    const input: AdjustItemRequest = AdjustItemRequestSchema.parse(body);
    return await this.adjustment.adjust(itemId, user.sub, input, 'void');
  }

  @Post(':id/comp')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('orders:update_status')
  @ApiOperation({
    summary: 'Comp an order item line (requires manager PIN or orders:comp permission)',
    description: staffAccess('orders:update_status'),
  })
  @ApiParam({ name: 'id', schema: zodToOpenApi(UuidSchema) })
  @ApiBody({ schema: zodToOpenApi(AdjustItemRequestSchema) })
  @ApiEnvelopedOk(OrderLineSchema)
  public async compLine(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<OrderLine> {
    const itemId = requireUuid(id, 'ไม่พบรายการ');
    const input: AdjustItemRequest = AdjustItemRequestSchema.parse(body);
    return await this.adjustment.adjust(itemId, user.sub, input, 'comp');
  }
}
