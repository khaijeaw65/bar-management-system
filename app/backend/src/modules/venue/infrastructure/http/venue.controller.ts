import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { VenueSettingsSchema, type VenueSettings } from '@bar/contracts';
import { RequirePermissions } from '../../../../common/decorators/require-permissions.decorator.js';
import { ApiEnvelopedOk } from '../../../../common/openapi/api-enveloped.js';
import { VenueSettingsService } from '../../application/venue-settings.service.js';
import { staffAccess } from '../../../../common/http/http-input.js';

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
}
