import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  AcknowledgeCallResultSchema,
  CreateSeatRequestSchema,
  RegenerateQrResponseSchema,
  ReorderSeatsRequestSchema,
  SeatAdminListSchema,
  SeatAdminSchema,
  TableListSchema,
  UpdateSeatRequestSchema,
  UuidSchema,
  type AcknowledgeCallResult,
  type RegenerateQrResponse,
  type SeatAdmin,
  type SeatAdminList,
  type TableList,
} from '@bar/contracts';
import { RequirePermissions } from '../../../../common/decorators/require-permissions.decorator.js';
import { ApiEnvelopedCreated, ApiEnvelopedOk } from '../../../../common/openapi/api-enveloped.js';
import { zodToOpenApi } from '../../../../common/openapi/zod-to-openapi.js';
import { TableAdminService } from '../../application/table-admin.service.js';
import { TableSeatService } from '../../application/table-seat.service.js';
import { requireUuid, staffAccess } from '../../../../common/http/http-input.js';

@ApiTags('venue')
@Controller('tables')
export class TablesController {
  public constructor(
    private readonly tableSeatService: TableSeatService,
    private readonly tableAdminService: TableAdminService,
  ) {}

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

  @Get('manage')
  @RequirePermissions('tables:manage')
  @ApiOperation({
    summary: 'List all seats for back office management',
    description: staffAccess('tables:manage'),
  })
  @ApiEnvelopedOk(SeatAdminListSchema)
  public async listManage(): Promise<SeatAdminList> {
    return await this.tableAdminService.listManage();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('tables:manage')
  @ApiOperation({
    summary: 'Create a new seat',
    description: staffAccess('tables:manage'),
  })
  @ApiBody({ schema: zodToOpenApi(CreateSeatRequestSchema) })
  @ApiEnvelopedCreated(SeatAdminSchema)
  public async create(@Body() body: unknown): Promise<SeatAdmin> {
    return await this.tableAdminService.create(CreateSeatRequestSchema.parse(body));
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('tables:manage')
  @ApiOperation({
    summary: 'Update a seat label or kind',
    description: staffAccess('tables:manage'),
  })
  @ApiParam({ name: 'id', schema: zodToOpenApi(UuidSchema) })
  @ApiBody({ schema: zodToOpenApi(UpdateSeatRequestSchema) })
  @ApiEnvelopedOk(SeatAdminSchema)
  public async update(
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<SeatAdmin> {
    return await this.tableAdminService.update(
      requireUuid(id, 'ไม่พบโต๊ะ'),
      UpdateSeatRequestSchema.parse(body),
    );
  }

  @Put('order')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('tables:manage')
  @ApiOperation({
    summary: 'Reorder seats for a section',
    description: staffAccess('tables:manage'),
  })
  @ApiBody({ schema: zodToOpenApi(ReorderSeatsRequestSchema) })
  @ApiEnvelopedOk(SeatAdminListSchema)
  public async reorder(@Body() body: unknown): Promise<SeatAdminList> {
    return await this.tableAdminService.reorder(ReorderSeatsRequestSchema.parse(body));
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('tables:manage')
  @ApiOperation({
    summary: 'Deactivate a seat',
    description: staffAccess('tables:manage'),
  })
  @ApiParam({ name: 'id', schema: zodToOpenApi(UuidSchema) })
  @ApiEnvelopedOk(SeatAdminSchema)
  public async deactivate(@Param('id') id: string): Promise<SeatAdmin> {
    return await this.tableAdminService.deactivate(requireUuid(id, 'ไม่พบโต๊ะ'));
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('tables:manage')
  @ApiOperation({
    summary: 'Activate a seat',
    description: staffAccess('tables:manage'),
  })
  @ApiParam({ name: 'id', schema: zodToOpenApi(UuidSchema) })
  @ApiEnvelopedOk(SeatAdminSchema)
  public async activate(@Param('id') id: string): Promise<SeatAdmin> {
    return await this.tableAdminService.activate(requireUuid(id, 'ไม่พบโต๊ะ'));
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
