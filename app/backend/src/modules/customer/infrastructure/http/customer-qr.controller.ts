import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags, ApiTooManyRequestsResponse } from '@nestjs/swagger';
import {
  CustomerSessionSchema,
  StartCustomerSessionSchema,
  type CustomerSession,
} from '@bar/contracts';
import type { Request, Response } from 'express';
import { Public } from '../../../../common/decorators/public.decorator.js';
import { ApiEnvelopedCreated } from '../../../../common/openapi/api-enveloped.js';
import { zodToOpenApi } from '../../../../common/openapi/zod-to-openapi.js';
import { AppConfigService } from '../../../../providers/config/app/config.service.js';
import { GuestSessionService } from '../../application/guest-session.service.js';
import { toCustomerSession } from '../../application/customer-session-view.js';
import { GUEST_COOKIE, guestCookieOptions } from './guest-cookie.js';

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
