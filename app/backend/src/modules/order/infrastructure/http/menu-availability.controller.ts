import { Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { MarkAvailabilityResultSchema, UuidSchema, type MarkAvailabilityResult } from '@bar/contracts';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator.js';
import type { CurrentUserPayload } from '../../../../common/decorators/current-user.types.js';
import { RequirePermissions } from '../../../../common/decorators/require-permissions.decorator.js';
import { staffAccess } from '../../../../common/http/http-input.js';
import { ApiEnvelopedOk } from '../../../../common/openapi/api-enveloped.js';
import { zodToOpenApi } from '../../../../common/openapi/zod-to-openapi.js';
import { SoldOutService } from '../../application/sold-out.service.js';

@ApiTags('menu')
@Controller('menu/items')
export class MenuAvailabilityController {
  public constructor(private readonly soldOut: SoldOutService) {}

  @Post(':id/mark-unavailable')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('menu:toggle_availability')
  @ApiOperation({
    summary: 'Mark an item sold out and auto-void its lines on pending tickets',
    description: staffAccess('menu:toggle_availability'),
  })
  @ApiParam({ name: 'id', schema: zodToOpenApi(UuidSchema) })
  @ApiEnvelopedOk(MarkAvailabilityResultSchema)
  public markUnavailable(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<MarkAvailabilityResult> {
    return this.soldOut.markUnavailable(UuidSchema.parse(id), user.sub);
  }

  @Post(':id/mark-available')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('menu:toggle_availability')
  @ApiOperation({
    summary: 'Mark an item available again. Voided lines stay voided.',
    description: staffAccess('menu:toggle_availability'),
  })
  @ApiParam({ name: 'id', schema: zodToOpenApi(UuidSchema) })
  @ApiEnvelopedOk(MarkAvailabilityResultSchema)
  public markAvailable(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<MarkAvailabilityResult> {
    return this.soldOut.markAvailable(UuidSchema.parse(id), user.sub);
  }
}
