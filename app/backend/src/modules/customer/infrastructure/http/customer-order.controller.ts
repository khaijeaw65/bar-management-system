import { Body, Controller, Get, Headers, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiHeader, ApiOperation, ApiTags, ApiTooManyRequestsResponse } from '@nestjs/swagger';
import {
  CallStaffResultSchema,
  CustomerCallStaffSchema,
  CustomerPlaceOrderResultSchema,
  CustomerPlaceOrderSchema,
  CustomerTabSchema,
  type CallStaffResult,
  type CustomerPlaceOrderResult,
  type CustomerTab,
} from '@bar/contracts';
import { Public } from '../../../../common/decorators/public.decorator.js';
import { ApiEnvelopedCreated, ApiEnvelopedOk } from '../../../../common/openapi/api-enveloped.js';
import { zodToOpenApi } from '../../../../common/openapi/zod-to-openapi.js';
import { idempotencyKey } from '../../../../common/idempotency/idempotency-key.js';
import { CustomerCallService } from '../../application/customer-call.service.js';
import { CustomerOrderService } from '../../application/customer-order.service.js';
import { CustomerTabService } from '../../application/customer-tab.service.js';
import type { GuestSessionView } from '../../domain/guest-session.types.js';
import { CurrentGuest } from './current-guest.decorator.js';
import { GuestSessionGuard } from './guest-session.guard.js';

const RATE_LIMITED = { description: 'RATE_LIMITED', schema: { $ref: '#/components/schemas/ApiError' } } as const;

@ApiTags('customer')
@ApiCookieAuth('guest_session')
@Controller('customer')
@Public()
@UseGuards(GuestSessionGuard)
export class CustomerOrderController {
  public constructor(
    private readonly orders: CustomerOrderService,
    private readonly tab: CustomerTabService,
    private readonly calls: CustomerCallService,
  ) {}

  @Post('orders')
  @ApiOperation({
    summary: 'Send an order from the phone',
    description:
      'Auth: `guest_session` cookie. The first order on a free table opens the visit (`opened_via = qr`) or joins the one POS opened. ' +
      '`orderedByName` is taken from the nickname, never the body. One order per 10 s per session. ' +
      '409 ITEM_UNAVAILABLE for a sold-out / out-of-window line, 400 for a charge line. `Idempotency-Key` replays the same order.',
  })
  @ApiHeader({ name: 'Idempotency-Key', required: false, description: 'UUID; scoped to the guest session' })
  @ApiBody({ schema: zodToOpenApi(CustomerPlaceOrderSchema) })
  @ApiEnvelopedCreated(CustomerPlaceOrderResultSchema)
  @ApiTooManyRequestsResponse(RATE_LIMITED)
  public place(
    @CurrentGuest() guest: GuestSessionView,
    @Body() body: unknown,
    @Headers('idempotency-key') header: string | undefined,
  ): Promise<CustomerPlaceOrderResult> {
    return this.orders.place(guest, body, idempotencyKey(header));
  }

  @Get('tab')
  @ApiOperation({
    summary: 'The running tab of the whole table, with "ของฉัน" marked per order',
    description:
      'Auth: `guest_session` cookie. Every order on the visit (guest and staff entered), newest first, from snapshots. ' +
      'Cancelled lines stay, struck, and are left out of `total`. A seat-only session gets an empty tab. No staff or other guests\' identities.',
  })
  @ApiEnvelopedOk(CustomerTabSchema)
  public getTab(@CurrentGuest() guest: GuestSessionView): Promise<CustomerTab> {
    return this.tab.get(guest);
  }

  @Post('call-staff')
  @ApiOperation({
    summary: 'Ring the bell for staff',
    description:
      'Auth: `guest_session` cookie. Optional `reason` (`bill` / `other`) and `note` (≤ 100). Sets the flag on the seat; ' +
      'staff clear it with `POST /tables/:seatId/acknowledge-call`. One call per 60 s per session.',
  })
  @ApiBody({ schema: zodToOpenApi(CustomerCallStaffSchema) })
  @ApiEnvelopedCreated(CallStaffResultSchema)
  @ApiTooManyRequestsResponse(RATE_LIMITED)
  public async callStaff(
    @CurrentGuest() guest: GuestSessionView,
    @Body() body: unknown,
  ): Promise<CallStaffResult> {
    return this.calls.call(guest, CustomerCallStaffSchema.parse(body ?? {}));
  }
}
