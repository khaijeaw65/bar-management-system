import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  AccessRequestSchema,
  ApproveAccessRequestSchema,
  ListAccessRequestsQuerySchema,
  StaffMemberSchema,
  type AccessRequest,
  type StaffMember,
} from '@bar/contracts';
import { z } from 'zod';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator.js';
import type { CurrentUserPayload } from '../../../../common/decorators/current-user.types.js';
import { RequirePermissions } from '../../../../common/decorators/require-permissions.decorator.js';
import { requireUuid, staffAccess } from '../../../../common/http/http-input.js';
import { ApiEnvelopedCreated, ApiEnvelopedOk } from '../../../../common/openapi/api-enveloped.js';
import { zodToOpenApi } from '../../../../common/openapi/zod-to-openapi.js';
import { StaffAdminService } from '../../application/staff-admin.service.js';

const ACCESS = staffAccess('staff:manage');
const REQUEST_NOT_FOUND = 'ไม่พบคำขอ';

/** Declared before `StaffController` in the module so `/staff/access-requests` is never read as `/staff/:id`. */
@ApiTags('staff')
@Controller('staff/access-requests')
export class AccessRequestsController {
  public constructor(private readonly staffAdmin: StaffAdminService) {}

  @Get()
  @RequirePermissions('staff:manage')
  @ApiOperation({
    summary: 'LINE access requests',
    description: `${ACCESS} Newest first. \`status\` = pending (default) or rejected.`,
  })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'rejected'] })
  @ApiEnvelopedOk(z.array(AccessRequestSchema))
  public list(@Query() query: unknown): Promise<AccessRequest[]> {
    return this.staffAdmin.listRequests(ListAccessRequestsQuerySchema.parse(query).status);
  }

  @Post(':id/approve')
  @RequirePermissions('staff:manage')
  @ApiOperation({
    summary: 'Approve a request: create the staff member with their groups',
    description:
      `${ACCESS} One transaction. \`until\`: permanent | end_of_night (next venue cut-off) | a future ISO time. ` +
      'Already decided → 409 ACCESS_REQUEST_DECIDED.',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ schema: zodToOpenApi(ApproveAccessRequestSchema) })
  @ApiEnvelopedCreated(StaffMemberSchema)
  public approve(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<StaffMember> {
    return this.staffAdmin.approve(requireUuid(id, REQUEST_NOT_FOUND), ApproveAccessRequestSchema.parse(body), user.sub);
  }

  @Post(':id/reject')
  @RequirePermissions('staff:manage')
  @ApiOperation({
    summary: 'Reject a pending request',
    description: `${ACCESS} The same LINE account stays rejected until the request is reopened.`,
  })
  @ApiParam({ name: 'id', type: String })
  @ApiEnvelopedCreated(AccessRequestSchema)
  public reject(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload): Promise<AccessRequest> {
    return this.staffAdmin.reject(requireUuid(id, REQUEST_NOT_FOUND), user.sub);
  }

  @Post(':id/reopen')
  @RequirePermissions('staff:manage')
  @ApiOperation({
    summary: 'Move a rejected request back to pending',
    description: ACCESS,
  })
  @ApiParam({ name: 'id', type: String })
  @ApiEnvelopedCreated(AccessRequestSchema)
  public reopen(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload): Promise<AccessRequest> {
    return this.staffAdmin.reopen(requireUuid(id, REQUEST_NOT_FOUND), user.sub);
  }
}
