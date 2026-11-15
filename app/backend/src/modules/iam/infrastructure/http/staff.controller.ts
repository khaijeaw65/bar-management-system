import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Put } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  EffectivePermissionsSchema,
  ReplaceMembershipsSchema,
  SetPolicyIdsSchema,
  StaffMemberSchema,
  UpdateStaffSchema,
  type EffectivePermissions,
  type StaffMember,
} from '@bar/contracts';
import { z } from 'zod';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator.js';
import type { CurrentUserPayload } from '../../../../common/decorators/current-user.types.js';
import { RequirePermissions } from '../../../../common/decorators/require-permissions.decorator.js';
import { requireUuid, staffAccess } from '../../../../common/http/http-input.js';
import { ApiEnvelopedOk } from '../../../../common/openapi/api-enveloped.js';
import { zodToOpenApi } from '../../../../common/openapi/zod-to-openapi.js';
import { StaffAdminService } from '../../application/staff-admin.service.js';
import { StaffPinService } from '../../application/staff-pin.service.js';

const ACCESS = staffAccess('staff:manage');
const STAFF_NOT_FOUND = 'ไม่พบพนักงาน';

@ApiTags('staff')
@Controller('staff')
export class StaffController {
  public constructor(
    private readonly staffAdmin: StaffAdminService,
    private readonly staffPin: StaffPinService,
  ) {}

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

  @Put(':id/policies')
  @RequirePermissions('staff:manage')
  @ApiOperation({
    summary: "Replace the person's personal policies",
    description:
      `${ACCESS} Policies attached to this one person on top of their groups. ` +
      'Unknown policy → 400; would leave nobody holding staff:manage for good → 409 IAM_LOCKOUT.',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ schema: zodToOpenApi(SetPolicyIdsSchema) })
  @ApiEnvelopedOk(StaffMemberSchema)
  public replacePolicies(@Param('id') id: string, @Body() body: unknown): Promise<StaffMember> {
    return this.staffAdmin.replacePolicies(requireUuid(id, STAFF_NOT_FOUND), SetPolicyIdsSchema.parse(body).policyIds);
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

  @Delete(':id/pin')
  @RequirePermissions('staff:manage')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Owner reset of a staff POS PIN',
    description: `${ACCESS} Resets pos_pin_hash to null. Audited.`,
  })
  @ApiParam({ name: 'id', type: String })
  public async resetPin(@Param('id') id: string): Promise<void> {
    await this.staffPin.resetPin(requireUuid(id, STAFF_NOT_FOUND));
  }
}
