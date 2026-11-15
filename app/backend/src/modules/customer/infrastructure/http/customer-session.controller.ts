import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CustomerSessionSchema,
  UpdateCustomerSessionSchema,
  type CustomerSession,
} from '@bar/contracts';
import { blankToNull } from '../../../../common/http/http-input.js';
import { Public } from '../../../../common/decorators/public.decorator.js';
import { ApiEnvelopedOk } from '../../../../common/openapi/api-enveloped.js';
import { zodToOpenApi } from '../../../../common/openapi/zod-to-openapi.js';
import { GuestSessionService } from '../../application/guest-session.service.js';
import { toCustomerSession } from '../../application/customer-session-view.js';
import type { GuestSessionView } from '../../domain/guest-session.types.js';
import { CurrentGuest } from './current-guest.decorator.js';
import { GuestSessionGuard } from './guest-session.guard.js';

@ApiTags('customer')
@ApiCookieAuth('guest_session')
@Controller('customer/session')
@Public()
@UseGuards(GuestSessionGuard)
export class CustomerSessionController {
  public constructor(private readonly sessions: GuestSessionService) {}

  @Get()
  @ApiOperation({
    summary: 'The current guest session (restores seat and nickname after a reload)',
    description: 'Auth: `guest_session` cookie (DR-028). 401 GUEST_SESSION_INVALID when missing, expired or the visit closed.',
  })
  @ApiEnvelopedOk(CustomerSessionSchema)
  public get(@CurrentGuest() guest: GuestSessionView): CustomerSession {
    return toCustomerSession(guest);
  }

  @Patch()
  @ApiOperation({
    summary: 'Set or clear the nickname',
    description: 'Auth: `guest_session` cookie. Trimmed, 1–30 characters; empty clears it (null).',
  })
  @ApiBody({ schema: zodToOpenApi(UpdateCustomerSessionSchema) })
  @ApiEnvelopedOk(CustomerSessionSchema)
  public async rename(
    @CurrentGuest() guest: GuestSessionView,
    @Body() body: unknown,
  ): Promise<CustomerSession> {
    const { displayName } = UpdateCustomerSessionSchema.parse(body);
    return toCustomerSession(await this.sessions.rename(guest, blankToNull(displayName)));
  }
}
