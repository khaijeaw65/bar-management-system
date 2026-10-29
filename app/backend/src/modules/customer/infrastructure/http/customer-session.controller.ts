import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiTags, ApiTooManyRequestsResponse } from '@nestjs/swagger';
import {
  CustomerSessionSchema,
  StartCustomerSessionSchema,
  UpdateCustomerSessionSchema,
  type CustomerSession,
} from '@bar/contracts';
import type { Request, Response } from 'express';
import { blankToNull } from '../../../../common/http/http-input.js';
import { Public } from '../../../../common/decorators/public.decorator.js';
import { ApiEnvelopedCreated, ApiEnvelopedOk } from '../../../../common/openapi/api-enveloped.js';
import { zodToOpenApi } from '../../../../common/openapi/zod-to-openapi.js';
import { AppConfigService } from '../../../../providers/config/app/config.service.js';
import { GuestSessionService } from '../../application/guest-session.service.js';
import { toCustomerSession } from '../../application/customer-session-view.js';
import type { GuestSessionView } from '../../domain/guest-session.types.js';
import { CurrentGuest } from './current-guest.decorator.js';
import { GUEST_COOKIE, guestCookieOptions } from './guest-cookie.js';
import { GuestSessionGuard } from './guest-session.guard.js';

/** The scan is the only `/customer` route without the guard — it is what creates the session. */
@ApiTags('customer')
@Controller('customer/sessions')
@Public()
export class CustomerScanController {
  public constructor(
    private readonly sessions: GuestSessionService,
    private readonly appConfig: AppConfigService,
  ) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({
    summary: 'Scan a table QR: start (or resume) a guest session',
    description:
      'No login. Throttled 30 / min per IP. Sets the HttpOnly `guest_session` cookie (Path=/api/customer). ' +
      '201 when a session was created, 200 when the cookie already holds a session on this seat. 404 QR_INVALID for an unknown or inactive QR.',
  })
  @ApiBody({ schema: zodToOpenApi(StartCustomerSessionSchema) })
  @ApiEnvelopedCreated(CustomerSessionSchema)
  @ApiTooManyRequestsResponse({ description: 'RATE_LIMITED', schema: { $ref: '#/components/schemas/ApiError' } })
  public async start(
    @Body() body: unknown,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<CustomerSession> {
    const { qrToken } = StartCustomerSessionSchema.parse(body);
    const started = await this.sessions.start({
      qrToken,
      ip: request.ip ?? 'unknown',
      rawToken: request.cookies?.[GUEST_COOKIE],
    });
    if (started.token) {
      response.cookie(GUEST_COOKIE, started.token, guestCookieOptions(this.appConfig.nodeEnv));
    } else {
      response.status(200);
    }
    return toCustomerSession(started.session);
  }
}

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
