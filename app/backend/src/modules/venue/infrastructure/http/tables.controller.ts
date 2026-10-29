import { Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  AcknowledgeCallResultSchema,
  RegenerateQrResponseSchema,
  TableListSchema,
  UuidSchema,
  type AcknowledgeCallResult,
  type RegenerateQrResponse,
  type TableList,
} from '@bar/contracts';
import { RequirePermissions } from '../../../../common/decorators/require-permissions.decorator.js';
import { ApiEnvelopedOk } from '../../../../common/openapi/api-enveloped.js';
import { zodToOpenApi } from '../../../../common/openapi/zod-to-openapi.js';
import { TableSeatService } from '../../application/table-seat.service.js';
import { requireUuid, staffAccess } from '../../../../common/http/http-input.js';

@ApiTags('venue')
@Controller('tables')
export class TablesController {
  public constructor(private readonly tableSeatService: TableSeatService) {}

  @Get()
  @RequirePermissions('tables:read')
  @ApiOperation({
    summary: 'List active seats and their live visit',
    description: staffAccess('tables:read'),
  })
  @ApiEnvelopedOk(TableListSchema)
  public async list(): Promise<TableList> {
    return { items: await this.tableSeatService.list() };
  }

  @Post(':id/qr/regenerate')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('tables:manage')
  @ApiOperation({
    summary: 'Replace the table QR token',
    description: staffAccess('tables:manage'),
  })
  @ApiParam({ name: 'id', schema: zodToOpenApi(UuidSchema) })
  @ApiEnvelopedOk(RegenerateQrResponseSchema)
  public async regenerate(
    @Param('id') id: string,
  ): Promise<RegenerateQrResponse> {
    const qrToken = await this.tableSeatService.regenerateQr(requireUuid(id, 'ไม่พบโต๊ะ'));
    return { qrToken };
  }

  @Post(':seatId/acknowledge-call')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('tables:read')
  @ApiOperation({
    summary: 'Clear the call-staff bell on a seat',
    description: `${staffAccess('tables:read')} Idempotent: a seat with no bell answers 200 as well.`,
  })
  @ApiParam({ name: 'seatId', schema: zodToOpenApi(UuidSchema) })
  @ApiEnvelopedOk(AcknowledgeCallResultSchema)
  public async acknowledgeCall(@Param('seatId') seatId: string): Promise<AcknowledgeCallResult> {
    await this.tableSeatService.acknowledgeCall(requireUuid(seatId, 'ไม่พบโต๊ะ'));
    return { ok: true };
  }
}
