import { Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import {
  TicketListQuerySchema,
  TicketListSchema,
  TicketSchema,
  UuidSchema,
  type Ticket,
  type TicketList,
} from '@bar/contracts';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator.js';
import type { CurrentUserPayload } from '../../../../common/decorators/current-user.types.js';
import { RequirePermissions } from '../../../../common/decorators/require-permissions.decorator.js';
import { ApiEnvelopedOk } from '../../../../common/openapi/api-enveloped.js';
import { zodToOpenApi } from '../../../../common/openapi/zod-to-openapi.js';
import { OrderQueryService } from '../../application/order-query.service.js';
import { TicketService } from '../../application/ticket.service.js';
import { requireUuid, staffAccess } from './http-input.js';

@Controller('tickets')
export class TicketsController {
  public constructor(
    private readonly tickets: TicketService,
    private readonly query: OrderQueryService,
  ) {}

  @Get()
  @RequirePermissions('orders:read')
  @ApiOperation({
    summary: 'Station queue. Charge tickets are excluded.',
    description: staffAccess('orders:read'),
  })
  @ApiQuery({ name: 'status', required: false, schema: { type: 'string' } })
  @ApiQuery({ name: 'visitId', required: false, schema: zodToOpenApi(UuidSchema) })
  @ApiEnvelopedOk(TicketListSchema)
  public list(@Query() query: unknown): Promise<TicketList> {
    return this.query.tickets(TicketListQuerySchema.parse(query)).then((items) => ({ items }));
  }

  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('orders:update_status')
  @ApiOperation({ summary: 'pending to accepted', description: staffAccess('orders:update_status') })
  @ApiParam({ name: 'id', schema: zodToOpenApi(UuidSchema) })
  @ApiEnvelopedOk(TicketSchema)
  public accept(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload): Promise<Ticket> {
    return this.tickets.accept(requireUuid(id, 'ไม่พบใบงาน'), user.sub);
  }

  @Post(':id/ready')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('orders:update_status')
  @ApiOperation({
    summary: 'accepted to ready, only for a table when the kitchen screen is on',
    description: staffAccess('orders:update_status'),
  })
  @ApiParam({ name: 'id', schema: zodToOpenApi(UuidSchema) })
  @ApiEnvelopedOk(TicketSchema)
  public ready(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload): Promise<Ticket> {
    return this.tickets.ready(requireUuid(id, 'ไม่พบใบงาน'), user.sub);
  }

  @Post(':id/send')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('orders:update_status')
  @ApiOperation({
    summary: 'ready to sent, or accepted to sent when READY is skipped',
    description: staffAccess('orders:update_status'),
  })
  @ApiParam({ name: 'id', schema: zodToOpenApi(UuidSchema) })
  @ApiEnvelopedOk(TicketSchema)
  public send(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload): Promise<Ticket> {
    return this.tickets.send(requireUuid(id, 'ไม่พบใบงาน'), user.sub);
  }
}
