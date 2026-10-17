import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
  applyDecorators,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  OpenVisitRequestSchema,
  OpenVisitResponseSchema,
  UuidSchema,
  VisitSchema,
  apiResponseSchema,
  type OpenVisitRequest,
  type OpenVisitResponse,
  type Visit,
} from '@bar/contracts';
import type { Response } from 'express';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator.js';
import type { CurrentUserPayload } from '../../../../common/decorators/current-user.types.js';
import { RequirePermissions } from '../../../../common/decorators/require-permissions.decorator.js';
import { ApiEnvelopedOk, ApiStandardErrors } from '../../../../common/openapi/api-enveloped.js';
import { zodToOpenApi } from '../../../../common/openapi/zod-to-openapi.js';
import type { OpenVisitInput } from '../../application/visit.types.js';
import { VisitService } from '../../application/visit.service.js';
import { blankToNull, requireUuid, staffAccess } from './http-input.js';
import { toVisitBody } from './visit.mapper.js';

@ApiTags('venue')
@Controller('visits')
export class VisitsController {
  public constructor(private readonly visits: VisitService) {}

  @Post()
  @RequirePermissions('visits:open')
  @ApiOperation({
    summary: 'Open a visit, or attach when the seat is already live',
    description: staffAccess('visits:open'),
  })
  @ApiBody({ schema: zodToOpenApi(OpenVisitRequestSchema) })
  @ApiOpenVisit()
  public async open(
    @Body() body: unknown,
    @CurrentUser() user: CurrentUserPayload,
    @Res({ passthrough: true }) response: Response,
  ): Promise<OpenVisitResponse> {
    const result = await this.visits.open(openInput(body, user.sub));
    response.status(result.attached ? HttpStatus.OK : HttpStatus.CREATED);
    return { visit: toVisitBody(result.visit), attached: result.attached };
  }

  @Get(':id')
  @RequirePermissions('visits:read')
  @ApiOperation({
    summary: 'Visit header',
    description: staffAccess('visits:read'),
  })
  @ApiParam({ name: 'id', schema: zodToOpenApi(UuidSchema) })
  @ApiEnvelopedOk(VisitSchema)
  public async getOne(@Param('id') id: string): Promise<Visit> {
    const visitId = requireUuid(id, 'ไม่พบการเข้าใช้');
    return toVisitBody(await this.visits.getById(visitId));
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('visits:close')
  @ApiOperation({
    summary: 'Close an open, active, or idle visit',
    description: staffAccess('visits:close'),
  })
  @ApiParam({ name: 'id', schema: zodToOpenApi(UuidSchema) })
  @ApiEnvelopedOk(VisitSchema)
  public async close(@Param('id') id: string): Promise<Visit> {
    const visitId = requireUuid(id, 'ไม่พบการเข้าใช้');
    return toVisitBody(await this.visits.close(visitId));
  }
}

function openInput(body: unknown, staffId: string): OpenVisitInput {
  const parsed: OpenVisitRequest = OpenVisitRequestSchema.parse(body);
  return {
    tableSeatId: parsed.tableSeatId,
    guestLabel: blankToNull(parsed.guestLabel),
    via: parsed.via ?? 'pos',
    staffId,
  };
}

function ApiOpenVisit(): MethodDecorator {
  const schema = zodToOpenApi(apiResponseSchema(OpenVisitResponseSchema));
  return applyDecorators(
    ApiCreatedResponse({
      description: 'Created the visit. attached is false.',
      schema,
    }),
    ApiOkResponse({
      description: 'Attached to the live visit. attached is true.',
      schema,
    }),
    ApiStandardErrors(),
  );
}
