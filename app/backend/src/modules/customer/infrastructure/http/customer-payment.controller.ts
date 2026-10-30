import { Controller, Get, Headers, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiHeader, ApiOperation, ApiParam, ApiTags, ApiTooManyRequestsResponse } from '@nestjs/swagger';
import {
  CustomerPaymentSchema,
  CustomerPendingPaymentSchema,
  NotifyTransferResultSchema,
  UuidSchema,
  type CustomerPayment,
  type CustomerPendingPayment,
  type NotifyTransferResult,
} from '@bar/contracts';
import { Public } from '../../../../common/decorators/public.decorator.js';
import { ApiEnvelopedCreated, ApiEnvelopedOk } from '../../../../common/openapi/api-enveloped.js';
import { zodToOpenApi } from '../../../../common/openapi/zod-to-openapi.js';
import { idempotencyKey } from '../../../../common/idempotency/idempotency-key.js';
import { requireUuid } from '../../../../common/http/http-input.js';
import { CustomerPaymentService } from '../../application/customer-payment.service.js';
import type { GuestSessionView } from '../../domain/guest-session.types.js';
import { CurrentGuest } from './current-guest.decorator.js';
import { GuestSessionGuard } from './guest-session.guard.js';

const RATE_LIMITED = { description: 'RATE_LIMITED', schema: { $ref: '#/components/schemas/ApiError' } } as const;
const NOT_FOUND = 'ไม่พบการชำระเงิน';

@ApiTags('customer')
@ApiCookieAuth('guest_session')
@Controller('customer')
@Public()
@UseGuards(GuestSessionGuard)
export class CustomerPaymentController {
  public constructor(private readonly payments: CustomerPaymentService) {}

  @Get('payment')
  @ApiOperation({
    summary: 'The table bill and the visit\'s pending PromptPay payment, if any',
    description:
      'Auth: `guest_session` cookie. `pending` is whoever created it; `mine` marks this phone\'s own. A seat-only session gets a zero bill.',
  })
  @ApiEnvelopedOk(CustomerPaymentSchema)
  public get(@CurrentGuest() guest: GuestSessionView): Promise<CustomerPayment> {
    return this.payments.get(guest);
  }

  @Post('payments')
  @ApiOperation({
    summary: 'Create the table\'s PromptPay QR (merge)',
    description:
      'Auth: `guest_session` cookie. Same lock and 15-min expiry as staff payments, through `PaymentService`. ' +
      'Errors: 409 NOTHING_TO_PAY, PAYMENT_IN_FLIGHT, PROMPTPAY_NOT_SET, PAYMENT_MODE_UNAVAILABLE. `Idempotency-Key` replays the same payment.',
  })
  @ApiHeader({ name: 'Idempotency-Key', required: false, description: 'UUID; scoped to the guest session' })
  @ApiEnvelopedCreated(CustomerPendingPaymentSchema)
  public create(
    @CurrentGuest() guest: GuestSessionView,
    @Headers('idempotency-key') header: string | undefined,
  ): Promise<CustomerPendingPayment> {
    return this.payments.create(guest, idempotencyKey(header));
  }

  @Post('payments/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change payment method: cancel this phone\'s own pending QR',
    description:
      'Auth: `guest_session` cookie. 403 PAYMENT_NOT_YOURS for a payment another phone or the POS created; 409 INVALID_STATE_TRANSITION unless pending.',
  })
  @ApiParam({ name: 'id', schema: zodToOpenApi(UuidSchema) })
  @ApiEnvelopedOk(CustomerPaymentSchema)
  public cancel(@CurrentGuest() guest: GuestSessionView, @Param('id') id: string): Promise<CustomerPayment> {
    return this.payments.cancel(guest, requireUuid(id, NOT_FOUND));
  }

  @Post('payments/:id/notify-transfer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Tell staff the transfer was made (แจ้งโอนแล้ว)',
    description:
      'Auth: `guest_session` cookie. Rings the seat bell with reason `transfer` and the amount as `note`; never changes the payment. ' +
      'One tap per 60 s per session. 409 INVALID_STATE_TRANSITION unless the visit\'s payment is a pending PromptPay one.',
  })
  @ApiParam({ name: 'id', schema: zodToOpenApi(UuidSchema) })
  @ApiEnvelopedOk(NotifyTransferResultSchema)
  @ApiTooManyRequestsResponse(RATE_LIMITED)
  public notifyTransfer(@CurrentGuest() guest: GuestSessionView, @Param('id') id: string): Promise<NotifyTransferResult> {
    return this.payments.notifyTransfer(guest, requireUuid(id, NOT_FOUND));
  }
}
