import { Body, Controller, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  AccessRequestSchema,
  ApproveAccessRequestSchema,
  EffectivePermissionsSchema,
  ListAccessRequestsQuerySchema,
  ReplaceMembershipsSchema,
  StaffMemberSchema,
  UpdateStaffSchema,
  type AccessRequest,
  type EffectivePermissions,
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
const STAFF_NOT_FOUND = 'ไม่พบพนักงาน';

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

@ApiTags('staff')
@Controller('staff')
export class StaffController {
  public constructor(private readonly staffAdmin: StaffAdminService) {}

  @Get()
  @RequirePermissions('staff:manage')
  @ApiOperation({
    summary: 'Staff with their memberships',
    description: `${ACCESS} Active first, then by name. Each membership is live, future or expired.`,
  })
  @ApiEnvelopedOk(z.array(StaffMemberSchema))
  public list(): Promise<StaffMember[]> {
    return this.staffAdmin.list();
  }

  @Get(':id')
  @RequirePermissions('staff:manage')
  @ApiOperation({ summary: 'One staff member', description: ACCESS })
  @ApiParam({ name: 'id', type: String })
  @ApiEnvelopedOk(StaffMemberSchema)
  public get(@Param('id') id: string): Promise<StaffMember> {
    return this.staffAdmin.get(requireUuid(id, STAFF_NOT_FOUND));
  }

  @Patch(':id')
  @RequirePermissions('staff:manage')
  @ApiOperation({
    summary: 'Rename, deactivate or reactivate',
    description:
      `${ACCESS} Deactivating ends every web and mobile session. Yourself → 409 SELF_DEACTIVATE; ` +
      'the last permanent manager → 409 IAM_LOCKOUT.',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ schema: zodToOpenApi(UpdateStaffSchema) })
  @ApiEnvelopedOk(StaffMemberSchema)
  public update(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<StaffMember> {
    return this.staffAdmin.update(requireUuid(id, STAFF_NOT_FOUND), UpdateStaffSchema.parse(body), user.sub);
  }

  @Put(':id/memberships')
  @RequirePermissions('staff:manage')
  @ApiOperation({
    summary: "Replace the person's whole set of group memberships",
    description:
      `${ACCESS} Rows not in the body are removed, expired ones included. ` +
      'Would leave nobody holding staff:manage for good → 409 IAM_LOCKOUT.',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ schema: zodToOpenApi(ReplaceMembershipsSchema) })
  @ApiEnvelopedOk(StaffMemberSchema)
  public replaceMemberships(@Param('id') id: string, @Body() body: unknown): Promise<StaffMember> {
    return this.staffAdmin.replaceMemberships(
      requireUuid(id, STAFF_NOT_FOUND),
      ReplaceMembershipsSchema.parse(body).memberships,
    );
  }

  @Get(':id/effective-permissions')
  @RequirePermissions('staff:manage')
  @ApiOperation({
    summary: 'Permissions the person has now, with where each comes from',
    description: `${ACCESS} Live memberships and direct user policies only.`,
  })
  @ApiParam({ name: 'id', type: String })
  @ApiEnvelopedOk(EffectivePermissionsSchema)
  public effectivePermissions(@Param('id') id: string): Promise<EffectivePermissions> {
    return this.staffAdmin.effectivePermissions(requireUuid(id, STAFF_NOT_FOUND));
  }
}
