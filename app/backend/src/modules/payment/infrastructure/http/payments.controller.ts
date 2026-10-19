import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Param, Post, Res } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  CreatePaymentSchema,
  MarkPaidSchema,
  PaymentSchema,
  UuidSchema,
  type Payment,
  type PaymentAttempt,
} from '@bar/contracts';
import type { Response } from 'express';
import { RequirePermissions } from '../../../../common/decorators/require-permissions.decorator.js';
import { idempotencyKey } from '../../../../common/idempotency/idempotency-key.js';
import { IdempotencyService } from '../../../../common/idempotency/idempotency.service.js';
import { requestHash } from '../../../../common/idempotency/request-hash.js';
import { blankToNull, requireUuid, staffAccess } from '../../../../common/http/http-input.js';
import { ApiEnvelopedOk } from '../../../../common/openapi/api-enveloped.js';
import { zodToOpenApi } from '../../../../common/openapi/zod-to-openapi.js';
import { PaymentService } from '../../application/payment.service.js';
import type { MarkPaidInput } from '../../application/payment.types.js';
import { ApiCreatedPayment } from './payments.openapi.js';
import type { CreatePaymentHttp, NewPaymentHttp } from './payments.types.js';

@ApiTags('payment')
@Controller()
export class PaymentsController {
  public constructor(
    private readonly payments: PaymentService,
    private readonly idempotency: IdempotencyService,
  ) {}

  @Post('visits/:visitId/payments')
  @RequirePermissions('payments:create')
  @ApiOperation({
    summary: 'Collect the visit bill as one merged PromptPay QR or cash payment',
    description: staffAccess('payments:create'),
  })
  @ApiParam({ name: 'visitId', schema: zodToOpenApi(UuidSchema) })
  @ApiBody({ schema: zodToOpenApi(CreatePaymentSchema) })
  @ApiCreatedPayment()
  public create(
    @Param('visitId') visitId: string,
    @Body() body: unknown,
    @Headers('idempotency-key') header: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<PaymentAttempt> {
    return this.createParsed({
      visitId: requireUuid(visitId, 'ไม่พบการเข้าใช้'),
      body,
      header,
      response,
    });
  }

  @Get('payments/:id')
  @RequirePermissions('payments:read')
  @ApiOperation({ summary: 'One payment', description: staffAccess('payments:read') })
  @ApiParam({ name: 'id', schema: zodToOpenApi(UuidSchema) })
  @ApiEnvelopedOk(PaymentSchema)
  public getOne(@Param('id') id: string): Promise<Payment> {
    return this.payments.getById(requireUuid(id, 'ไม่พบการชำระเงิน'));
  }

  @Post('payments/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('payments:create')
  @ApiOperation({ summary: 'Cancel a pending payment', description: staffAccess('payments:create') })
  @ApiParam({ name: 'id', schema: zodToOpenApi(UuidSchema) })
  @ApiEnvelopedOk(PaymentSchema)
  public cancel(@Param('id') id: string): Promise<Payment> {
    return this.payments.cancel(requireUuid(id, 'ไม่พบการชำระเงิน'));
  }

  @Post('payments/:id/mark-paid')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('payments:mark_paid')
  @ApiOperation({
    summary: 'Confirm a pending payment manually or as cash',
    description: staffAccess('payments:mark_paid'),
  })
  @ApiParam({ name: 'id', schema: zodToOpenApi(UuidSchema) })
  @ApiBody({ schema: zodToOpenApi(MarkPaidSchema) })
  @ApiEnvelopedOk(PaymentSchema)
  public markPaid(@Param('id') id: string, @Body() body: unknown): Promise<Payment> {
    return this.payments.markPaid(this.markPaidInput(requireUuid(id, 'ไม่พบการชำระเงิน'), body));
  }

  private async createParsed(input: CreatePaymentHttp): Promise<PaymentAttempt> {
    const parsed = CreatePaymentSchema.parse(input.body);
    const key = idempotencyKey(input.header);
    const hash = requestHash({ visitId: input.visitId, method: parsed.method, mode: parsed.mode });
    const gate = await this.idempotency.begin<PaymentAttempt>({ scope: 'payment', key, hash });
    if (gate.kind === 'replay') return this.created(input.response, gate.body);
    return this.createNew({ visitId: input.visitId, method: parsed.method, key, hash, response: input.response });
  }

  private async createNew(input: NewPaymentHttp): Promise<PaymentAttempt> {
    try {
      const attempt = await this.payments.create({ visitId: input.visitId, method: input.method });
      await this.idempotency.finish({ scope: 'payment', key: input.key, hash: input.hash, body: attempt });
      return this.created(input.response, attempt);
    } catch (error) {
      await this.idempotency.cancel('payment', input.key);
      throw error;
    }
  }

  private markPaidInput(paymentId: string, body: unknown): MarkPaidInput {
    const parsed = MarkPaidSchema.parse(body);
    return {
      paymentId,
      via: parsed.via,
      reason: parsed.reason ?? null,
      note: blankToNull(parsed.note),
    };
  }

  private created(response: Response, attempt: PaymentAttempt): PaymentAttempt {
    response.status(201);
    return attempt;
  }
}
