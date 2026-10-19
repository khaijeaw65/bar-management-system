import { Body, Controller, Get, Headers, Param, Post, Res } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import {
  OrderSchema,
  PlaceOrderRequestSchema,
  UuidSchema,
  type Order,
  type PlaceOrderRequest,
} from '@bar/contracts';
import type { Response } from 'express';
import { RequirePermissions } from '../../../../common/decorators/require-permissions.decorator.js';
import { requireUuid, staffAccess } from '../../../../common/http/http-input.js';
import { ApiEnvelopedOk } from '../../../../common/openapi/api-enveloped.js';
import { zodToOpenApi } from '../../../../common/openapi/zod-to-openapi.js';
import { IdempotencyService } from '../../../../common/idempotency/idempotency.service.js';
import { requestHash } from '../../../../common/idempotency/request-hash.js';
import { OrderQueryService } from '../../application/order-query.service.js';
import { OrderService } from '../../application/order.service.js';
import { idempotencyKey, requestedLines } from './http-input.js';
import { ApiCreatedOrder } from './orders.openapi.js';

@Controller()
export class OrdersController {
  public constructor(
    private readonly orders: OrderService,
    private readonly query: OrderQueryService,
    private readonly idempotency: IdempotencyService,
  ) {}

  @Post('visits/:visitId/orders')
  @RequirePermissions('orders:create')
  @ApiOperation({ summary: 'Place an order on a live visit', description: staffAccess('orders:create') })
  @ApiParam({ name: 'visitId', schema: zodToOpenApi(UuidSchema) })
  @ApiBody({ schema: zodToOpenApi(PlaceOrderRequestSchema) })
  @ApiCreatedOrder()
  public place(
    @Param('visitId') visitId: string,
    @Body() body: unknown,
    @Headers('idempotency-key') header: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Order> {
    return this.placeParsed(requireUuid(visitId, 'ไม่พบการเข้าใช้'), body, header, response);
  }

  @Get('orders/:id')
  @RequirePermissions('orders:read')
  @ApiOperation({
    summary: 'One order and every ticket, including the charge ticket',
    description: staffAccess('orders:read'),
  })
  @ApiParam({ name: 'id', schema: zodToOpenApi(UuidSchema) })
  @ApiEnvelopedOk(OrderSchema)
  public getOne(@Param('id') id: string): Promise<Order> {
    return this.query.getById(requireUuid(id, 'ไม่พบออเดอร์'));
  }

  private async placeParsed(
    visitId: string,
    body: unknown,
    header: string | undefined,
    response: Response,
  ): Promise<Order> {
    const parsed = PlaceOrderRequestSchema.parse(body);
    const key = idempotencyKey(header);
    const hash = requestHash({ visitId, items: parsed.items });
    const gate = await this.idempotency.begin<Order>({ scope: 'order', key, hash });
    if (gate.kind === 'replay') return this.created(response, gate.body);
    return this.placeNew(visitId, parsed, key, hash, response);
  }

  private async placeNew(
    visitId: string,
    parsed: PlaceOrderRequest,
    key: string | null,
    hash: string,
    response: Response,
  ): Promise<Order> {
    try {
      const order = await this.orders.place({ visitId, items: requestedLines(parsed) });
      await this.idempotency.finish({ scope: 'order', key, hash, body: order });
      return this.created(response, order);
    } catch (error) {
      await this.idempotency.cancel('order', key);
      throw error;
    }
  }

  private created(response: Response, order: Order): Order {
    response.status(201);
    return order;
  }
}
