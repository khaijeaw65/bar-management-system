import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CustomerMenuSchema, type CustomerMenu } from '@bar/contracts';
import { Public } from '../../../../common/decorators/public.decorator.js';
import { ApiEnvelopedOk } from '../../../../common/openapi/api-enveloped.js';
import { CustomerMenuService } from '../../application/customer-menu.service.js';
import { GuestSessionGuard } from './guest-session.guard.js';

@ApiTags('customer')
@ApiCookieAuth('guest_session')
@Controller('customer/menu')
@Public()
@UseGuards(GuestSessionGuard)
export class CustomerMenuController {
  public constructor(private readonly menu: CustomerMenuService) {}

  @Get()
  @ApiOperation({
    summary: 'The menu a guest sees: categories and items in one call',
    description:
      'Auth: `guest_session` cookie. Active categories only; charge items excluded; sold-out and out-of-window items are listed with `availableNow: false` + `unavailableReason`. `imageUrl` is a presigned URL valid for 1 hour.',
  })
  @ApiEnvelopedOk(CustomerMenuSchema)
  public get(): Promise<CustomerMenu> {
    return this.menu.get();
  }
}
