import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  UpdateVenuePaymentSettingsSchema,
  VenuePaymentSettingsSchema,
  VenueSettingsSchema,
  type VenuePaymentSettings,
  type VenueSettings,
} from '@bar/contracts';
import { RequirePermissions } from '../../../../common/decorators/require-permissions.decorator.js';
import { staffAccess } from '../../../../common/http/http-input.js';
import { ApiEnvelopedOk } from '../../../../common/openapi/api-enveloped.js';
import { zodToOpenApi } from '../../../../common/openapi/zod-to-openapi.js';
import { VenueSettingsService } from '../../application/venue-settings.service.js';

@ApiTags('venue')
@Controller('venue')
export class VenueController {
  public constructor(private readonly venueSettings: VenueSettingsService) {}

  @Get()
  @RequirePermissions('venue:read')
  @ApiOperation({
    summary: 'Venue settings for POS and staff',
    description: staffAccess('venue:read'),
  })
  @ApiEnvelopedOk(VenueSettingsSchema)
  public get(): Promise<VenueSettings> {
    return this.venueSettings.get();
  }

  @Get('payment-settings')
  @RequirePermissions('venue:read_payment')
  @ApiOperation({
    summary: 'Masked PromptPay destination',
    description: staffAccess('venue:read_payment'),
  })
  @ApiEnvelopedOk(VenuePaymentSettingsSchema)
  public getPaymentSettings(): Promise<VenuePaymentSettings> {
    return this.venueSettings.getPaymentSettings();
  }

  @Patch('payment-settings')
  @RequirePermissions('venue:update_payment')
  @ApiOperation({
    summary: 'Set the venue PromptPay ID',
    description: staffAccess('venue:update_payment'),
  })
  @ApiBody({ schema: zodToOpenApi(UpdateVenuePaymentSettingsSchema) })
  @ApiEnvelopedOk(VenuePaymentSettingsSchema)
  public updatePaymentSettings(@Body() body: unknown): Promise<VenuePaymentSettings> {
    const input = UpdateVenuePaymentSettingsSchema.parse(body);
    return this.venueSettings.updatePaymentSettings(input);
  }
}
