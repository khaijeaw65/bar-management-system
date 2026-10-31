import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  CreatePolicySchema,
  CreateStaffGroupSchema,
  DeleteImpactSchema,
  OkSchema,
  PermissionCatalogSchema,
  PolicySchema,
  SetPolicyCodesSchema,
  SetPolicyIdsSchema,
  StaffGroupSchema,
  UpdatePolicySchema,
  UpdateStaffGroupSchema,
  type DeleteImpact,
  type Ok,
  type PermissionCatalog,
  type Policy,
  type StaffGroup,
} from '@bar/contracts';
import { z } from 'zod';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator.js';
import type { CurrentUserPayload } from '../../../../common/decorators/current-user.types.js';
import { RequirePermissions } from '../../../../common/decorators/require-permissions.decorator.js';
import { requireUuid, staffAccess } from '../../../../common/http/http-input.js';
import { ApiEnvelopedCreated, ApiEnvelopedOk } from '../../../../common/openapi/api-enveloped.js';
import { zodToOpenApi } from '../../../../common/openapi/zod-to-openapi.js';
import { IamAdminService } from '../../application/iam-admin.service.js';

const ACCESS = staffAccess('staff:manage');
const GROUP_NOT_FOUND = 'ไม่พบกลุ่ม';
const POLICY_NOT_FOUND = 'ไม่พบนโยบาย';

@ApiTags('staff')
@Controller('permissions')
export class PermissionCatalogController {
  public constructor(private readonly iamAdmin: IamAdminService) {}

  @Get('catalog')
  @RequirePermissions('staff:manage')
  @ApiOperation({
    summary: 'Every permission code, grouped by resource, with Thai labels',
    description: `${ACCESS} The rows and switches of the policy matrix.`,
  })
  @ApiEnvelopedOk(PermissionCatalogSchema)
  public catalog(): PermissionCatalog {
    return this.iamAdmin.catalog();
  }
}

@ApiTags('staff')
@Controller('staff-groups')
export class StaffGroupsController {
  public constructor(private readonly iamAdmin: IamAdminService) {}

  @Get()
  @RequirePermissions('staff:manage')
  @ApiOperation({
    summary: 'Groups with their attached policies',
    description: `${ACCESS} System groups (เจ้าของ, ผู้จัดการ, พนักงาน) first.`,
  })
  @ApiEnvelopedOk(z.array(StaffGroupSchema))
  public list(): Promise<StaffGroup[]> {
    return this.iamAdmin.listGroups();
  }

  @Post()
  @RequirePermissions('staff:manage')
  @ApiOperation({
    summary: 'Create a custom group',
    description: `${ACCESS} Name unique ignoring case and spaces → 409 GROUP_NAME_TAKEN.`,
  })
  @ApiBody({ schema: zodToOpenApi(CreateStaffGroupSchema) })
  @ApiEnvelopedCreated(StaffGroupSchema)
  public create(@Body() body: unknown, @CurrentUser() user: CurrentUserPayload): Promise<StaffGroup> {
    return this.iamAdmin.createGroup(CreateStaffGroupSchema.parse(body), user.sub);
  }

  @Patch(':id')
  @RequirePermissions('staff:manage')
  @ApiOperation({
    summary: 'Rename or describe a group',
    description: `${ACCESS} เจ้าของ → 409 SYSTEM_ROW; ผู้จัดการ / พนักงาน keep their name (description only).`,
  })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ schema: zodToOpenApi(UpdateStaffGroupSchema) })
  @ApiEnvelopedOk(StaffGroupSchema)
  public update(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<StaffGroup> {
    return this.iamAdmin.updateGroup(requireUuid(id, GROUP_NOT_FOUND), UpdateStaffGroupSchema.parse(body), user.sub);
  }

  @Put(':id/policies')
  @RequirePermissions('staff:manage')
  @ApiOperation({
    summary: "Replace the group's attached policies",
    description:
      `${ACCESS} เจ้าของ → 409 SYSTEM_ROW. Would leave nobody holding staff:manage for good → 409 IAM_LOCKOUT.`,
  })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ schema: zodToOpenApi(SetPolicyIdsSchema) })
  @ApiEnvelopedOk(StaffGroupSchema)
  public setPolicies(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<StaffGroup> {
    return this.iamAdmin.setGroupPolicies(requireUuid(id, GROUP_NOT_FOUND), SetPolicyIdsSchema.parse(body).policyIds, user.sub);
  }

  @Get(':id/delete-impact')
  @RequirePermissions('staff:manage')
  @ApiOperation({
    summary: 'Who would lose what if the group were deleted',
    description:
      `${ACCESS} \`losing\` = codes the person would no longer have from any other live group or personal policy.`,
  })
  @ApiParam({ name: 'id', type: String })
  @ApiEnvelopedOk(DeleteImpactSchema)
  public deleteImpact(@Param('id') id: string): Promise<DeleteImpact> {
    return this.iamAdmin.deleteImpact(requireUuid(id, GROUP_NOT_FOUND));
  }

  @Delete(':id')
  @RequirePermissions('staff:manage')
  @ApiOperation({
    summary: 'Delete a custom group and its memberships',
    description: `${ACCESS} System groups → 409 SYSTEM_ROW; would leave nobody holding staff:manage for good → 409 IAM_LOCKOUT.`,
  })
  @ApiParam({ name: 'id', type: String })
  @ApiEnvelopedOk(OkSchema)
  public remove(@Param('id') id: string): Promise<Ok> {
    return this.iamAdmin.deleteGroup(requireUuid(id, GROUP_NOT_FOUND));
  }
}

@ApiTags('staff')
@Controller('policies')
export class PoliciesController {
  public constructor(private readonly iamAdmin: IamAdminService) {}

  @Get()
  @RequirePermissions('staff:manage')
  @ApiOperation({
    summary: 'Policies with their permission codes and where they are used',
    description: `${ACCESS} \`usage\`: groups and people it is attached to; \`people\` = distinct staff reached.`,
  })
  @ApiEnvelopedOk(z.array(PolicySchema))
  public list(): Promise<Policy[]> {
    return this.iamAdmin.listPolicies();
  }

  @Post()
  @RequirePermissions('staff:manage')
  @ApiOperation({
    summary: 'Create a policy',
    description: `${ACCESS} Name unique ignoring case and spaces → 409 POLICY_NAME_TAKEN; unknown code → 400.`,
  })
  @ApiBody({ schema: zodToOpenApi(CreatePolicySchema) })
  @ApiEnvelopedCreated(PolicySchema)
  public create(@Body() body: unknown, @CurrentUser() user: CurrentUserPayload): Promise<Policy> {
    return this.iamAdmin.createPolicy(CreatePolicySchema.parse(body), user.sub);
  }

  @Patch(':id')
  @RequirePermissions('staff:manage')
  @ApiOperation({ summary: 'Rename or describe a policy', description: `${ACCESS} ทั้งหมด → 409 SYSTEM_ROW.` })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ schema: zodToOpenApi(UpdatePolicySchema) })
  @ApiEnvelopedOk(PolicySchema)
  public update(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<Policy> {
    return this.iamAdmin.updatePolicy(requireUuid(id, POLICY_NOT_FOUND), UpdatePolicySchema.parse(body), user.sub);
  }

  @Put(':id/permissions')
  @RequirePermissions('staff:manage')
  @ApiOperation({
    summary: 'Replace the permission codes a policy allows (the whole matrix)',
    description:
      `${ACCESS} ทั้งหมด → 409 SYSTEM_ROW; unknown code → 400; would leave nobody holding staff:manage for good → 409 IAM_LOCKOUT.`,
  })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ schema: zodToOpenApi(SetPolicyCodesSchema) })
  @ApiEnvelopedOk(PolicySchema)
  public setCodes(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<Policy> {
    return this.iamAdmin.setPolicyCodes(requireUuid(id, POLICY_NOT_FOUND), SetPolicyCodesSchema.parse(body).codes, user.sub);
  }

  @Delete(':id')
  @RequirePermissions('staff:manage')
  @ApiOperation({
    summary: 'Delete a policy nobody uses',
    description: `${ACCESS} Attached anywhere → 409 POLICY_IN_USE with the group / person names; ทั้งหมด → 409 SYSTEM_ROW.`,
  })
  @ApiParam({ name: 'id', type: String })
  @ApiEnvelopedOk(OkSchema)
  public remove(@Param('id') id: string): Promise<Ok> {
    return this.iamAdmin.deletePolicy(requireUuid(id, POLICY_NOT_FOUND));
  }
}
