import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  OpenVisitRequestSchema,
  UuidSchema,
  VisitDetailSchema,
  VisitSchema,
  type OpenVisitRequest,
  type OpenVisitResponse,
  type Visit,
  type VisitDetail,
} from '@bar/contracts';
import type { Response } from 'express';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator.js';
import type { CurrentUserPayload } from '../../../../common/decorators/current-user.types.js';
import { RequirePermissions } from '../../../../common/decorators/require-permissions.decorator.js';
import { blankToNull, requireUuid, staffAccess } from '../../../../common/http/http-input.js';
import { ApiEnvelopedOk } from '../../../../common/openapi/api-enveloped.js';
import { zodToOpenApi } from '../../../../common/openapi/zod-to-openapi.js';
import { BillService } from '../../../payment/application/bill.service.js';
import { PaymentService } from '../../../payment/application/payment.service.js';
import { OrderQueryService } from '../../../order/application/order-query.service.js';
import type { OpenVisitInput } from '../../application/visit.types.js';
import { VisitService } from '../../application/visit.service.js';
import { toVisitBody } from './visit.mapper.js';
import { ApiOpenVisit } from './visits.openapi.js';

@ApiTags('venue')
@Controller('visits')
export class VisitsController {
  public constructor(
    private readonly visitService: VisitService,
    private readonly orders: OrderQueryService,
    private readonly bills: BillService,
    private readonly payments: PaymentService,
  ) {}

  @Post()
  @RequirePermissions('visits:open')
  @ApiOperation({
    summary: 'Open a visit, or attach when the seat is already live',
    description: staffAccess('visits:open'),
  })
  @ApiBody({ schema: zodToOpenApi(OpenVisitRequestSchema) })
  @ApiOpenVisit()
  public async open(
    @Body() body: unknown,
    @CurrentUser() user: CurrentUserPayload,
    @Res({ passthrough: true }) response: Response,
  ): Promise<OpenVisitResponse> {
    const result = await this.visitService.open(this.openInput(body, user.sub));
    response.status(result.attached ? HttpStatus.OK : HttpStatus.CREATED);
    return { visit: toVisitBody(result.visit), attached: result.attached };
  }

  @Get(':id')
  @RequirePermissions('visits:read')
  @ApiOperation({
    summary: 'Visit header, orders, bill, and payments',
    description: staffAccess('visits:read'),
  })
  @ApiParam({ name: 'id', schema: zodToOpenApi(UuidSchema) })
  @ApiEnvelopedOk(VisitDetailSchema)
  public async getOne(@Param('id') id: string): Promise<VisitDetail> {
    return this.detail(requireUuid(id, 'ไม่พบการเข้าใช้'));
  }

  private async detail(visitId: string): Promise<VisitDetail> {
    const visit = toVisitBody(await this.visitService.getById(visitId));
    const snapshot = await this.bills.forVisit(visitId);
    return {
      ...visit,
      orders: await this.orders.forVisit(visitId),
      bill: snapshot.bill,
      payments: await this.payments.attemptsFor(visitId),
    };
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('visits:close')
  @ApiOperation({
    summary: 'Close an open, active, or idle visit. 409 PAYMENT_IN_FLIGHT while a payment is pending',
    description: staffAccess('visits:close'),
  })
  @ApiParam({ name: 'id', schema: zodToOpenApi(UuidSchema) })
  @ApiEnvelopedOk(VisitSchema)
  public async close(@Param('id') id: string): Promise<Visit> {
    const visitId = requireUuid(id, 'ไม่พบการเข้าใช้');
    return toVisitBody(await this.visitService.close(visitId));
  }

  private openInput(body: unknown, staffId: string): OpenVisitInput {
    const parsed: OpenVisitRequest = OpenVisitRequestSchema.parse(body);
    return {
      tableSeatId: parsed.tableSeatId,
      guestLabel: blankToNull(parsed.guestLabel),
      via: parsed.via ?? 'pos',
      staffId,
    };
  }
}
