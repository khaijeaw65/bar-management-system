import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import {
  PERMISSION_CATALOG,
  PERMISSION_CODES,
  type CreatePolicy,
  type CreateStaffGroup,
  type DeleteImpact,
  type PermissionCatalog,
  type PermissionCode,
  type Policy,
  type StaffGroup,
  type UpdatePolicy,
  type UpdateStaffGroup,
} from '@bar/contracts';
import { DomainException } from '../../../common/domain-exception.js';
import { DEFAULT_GROUP_IDS, DEFAULT_POLICY_IDS } from '../domain/default-groups.js';
import { deleteImpact } from '../domain/delete-impact.js';
import { IamAdminRepository } from '../domain/iam-admin.repository.js';
import type { GroupWriteOutcome, NamedInput, PolicyWriteOutcome } from '../domain/iam-admin.types.js';
import { IamVersion } from './iam-version.service.js';
import { systemFirst, systemGroupOf, toPolicy, toStaffGroup } from './iam-admin.mapper.js';

const LOCKOUT_MESSAGE = 'ต้องมีผู้ดูแลสิทธิ์อย่างน้อย 1 คนที่ไม่มีวันหมดอายุ';
const GROUP_NOT_FOUND = 'ไม่พบกลุ่ม';
const POLICY_NOT_FOUND = 'ไม่พบนโยบาย';

@Injectable()
export class IamAdminService implements OnApplicationBootstrap {
  private readonly logger = new Logger(IamAdminService.name);

  public constructor(
    private readonly repository: IamAdminRepository,
    private readonly iamVersion: IamVersion,
  ) {}

  /** ทั้งหมด always holds the whole catalog — a code added in contracts joins it on the next start (BRIEF-055). */
  public async onApplicationBootstrap(): Promise<void> {
    try {
      const added = await this.repository.completeAllPolicy(DEFAULT_POLICY_IDS.all, PERMISSION_CODES);
      if (added > 0) {
        this.logger.log(`IAM: added ${added} new permission(s) to ทั้งหมด`);
        await this.iamVersion.bump();
      }
    } catch (error) {
      // A database without the IAM tables yet (before migration:run) — the next start repairs it.
      this.logger.warn(`IAM: could not complete ทั้งหมด: ${String(error)}`);
    }
  }

  public catalog(): PermissionCatalog {
    return PERMISSION_CATALOG.map((row) => ({ ...row, actions: [...row.actions] }));
  }

  public async listGroups(): Promise<StaffGroup[]> {
    return systemFirst((await this.repository.listGroups()).map(toStaffGroup));
  }

  public async createGroup(input: CreateStaffGroup, actorId: string): Promise<StaffGroup> {
    const outcome = await this.repository.createGroup(this.named(input), [...new Set(input.policyIds)], actorId);
    return this.afterGroupWrite(outcome);
  }

  public async updateGroup(id: string, patch: UpdateStaffGroup, actorId: string): Promise<StaffGroup> {
    const system = systemGroupOf(id);
    if (system === 'owner' || (system !== null && patch.name !== undefined)) this.systemRow();
    const outcome = await this.repository.updateGroup(id, this.patchOf(patch), actorId);
    return this.afterGroupWrite(outcome);
  }

  public async setGroupPolicies(id: string, policyIds: string[], actorId: string): Promise<StaffGroup> {
    if (id === DEFAULT_GROUP_IDS.owner) this.systemRow();
    const outcome = await this.repository.setGroupPolicies(id, [...new Set(policyIds)], actorId, new Date());
    return this.afterGroupWrite(outcome);
  }

  public async deleteImpact(id: string): Promise<DeleteImpact> {
    if ((await this.repository.findGroup(id)) === null) throw this.notFound(GROUP_NOT_FOUND);
    const [members, codes] = await Promise.all([this.repository.groupMembers(id), this.repository.memberCodes(id, new Date())]);
    return deleteImpact(members, codes);
  }

  public async deleteGroup(id: string): Promise<{ ok: true }> {
    if (systemGroupOf(id) !== null) this.systemRow();
    const outcome = await this.repository.deleteGroup(id, new Date());
    this.throwGroupFailure(outcome);
    await this.iamVersion.bump();
    return { ok: true };
  }

  public async listPolicies(): Promise<Policy[]> {
    return (await this.repository.listPolicies(new Date())).map(toPolicy);
  }

  public async createPolicy(input: CreatePolicy, actorId: string): Promise<Policy> {
    const outcome = await this.repository.createPolicy(this.named(input), this.unique(input.codes), actorId);
    return this.afterPolicyWrite(outcome);
  }

  public async updatePolicy(id: string, patch: UpdatePolicy, actorId: string): Promise<Policy> {
    if (id === DEFAULT_POLICY_IDS.all) this.systemRow();
    return this.afterPolicyWrite(await this.repository.updatePolicy(id, this.patchOf(patch), actorId));
  }

  public async setPolicyCodes(id: string, codes: PermissionCode[], actorId: string): Promise<Policy> {
    if (id === DEFAULT_POLICY_IDS.all) this.systemRow();
    return this.afterPolicyWrite(await this.repository.setPolicyCodes(id, this.unique(codes), actorId, new Date()));
  }

  public async deletePolicy(id: string): Promise<{ ok: true }> {
    if (id === DEFAULT_POLICY_IDS.all) this.systemRow();
    const outcome = await this.repository.deletePolicy(id);
    this.throwPolicyFailure(outcome);
    await this.iamVersion.bump();
    return { ok: true };
  }

  private async afterGroupWrite(outcome: GroupWriteOutcome): Promise<StaffGroup> {
    this.throwGroupFailure(outcome);
    await this.iamVersion.bump();
    const row = outcome.kind === 'ok' ? await this.repository.findGroup(outcome.id) : null;
    if (!row) throw this.notFound(GROUP_NOT_FOUND);
    return toStaffGroup(row);
  }

  private async afterPolicyWrite(outcome: PolicyWriteOutcome): Promise<Policy> {
    this.throwPolicyFailure(outcome);
    await this.iamVersion.bump();
    const row = outcome.kind === 'ok' ? await this.repository.findPolicy(outcome.id, new Date()) : null;
    if (!row) throw this.notFound(POLICY_NOT_FOUND);
    return toPolicy(row);
  }

  private throwGroupFailure(outcome: GroupWriteOutcome): void {
    if (outcome.kind === 'ok') return;
    if (outcome.kind === 'not_found') throw this.notFound(GROUP_NOT_FOUND);
    if (outcome.kind === 'name_taken') throw new DomainException('GROUP_NAME_TAKEN', 'มีกลุ่มชื่อนี้อยู่แล้ว', 409);
    if (outcome.kind === 'unknown_policy') throw new DomainException('VALIDATION_ERROR', 'ไม่พบนโยบายที่เลือก', 400);
    throw this.lockout();
  }

  private throwPolicyFailure(outcome: PolicyWriteOutcome): void {
    if (outcome.kind === 'ok') return;
    if (outcome.kind === 'not_found') throw this.notFound(POLICY_NOT_FOUND);
    if (outcome.kind === 'name_taken') throw new DomainException('POLICY_NAME_TAKEN', 'มีนโยบายชื่อนี้อยู่แล้ว', 409);
    if (outcome.kind === 'unknown_code') throw new DomainException('VALIDATION_ERROR', 'ไม่พบสิทธิ์ที่เลือก', 400);
    if (outcome.kind === 'in_use') {
      throw new DomainException('POLICY_IN_USE', 'นโยบายนี้ยังถูกใช้อยู่', 409, {
        groups: outcome.groups,
        users: outcome.users,
      });
    }
    throw this.lockout();
  }

  private named(input: { name: string; description?: string }): NamedInput {
    return { name: input.name, description: input.description?.trim() ? input.description : null };
  }

  private patchOf(patch: { name?: string; description?: string }): Partial<NamedInput> {
    return {
      ...(patch.name === undefined ? {} : { name: patch.name }),
      ...(patch.description === undefined ? {} : { description: patch.description.trim() ? patch.description : null }),
    };
  }

  private unique<T>(values: T[]): T[] {
    return [...new Set(values)];
  }

  private systemRow(): never {
    throw new DomainException('SYSTEM_ROW', 'แถวระบบ แก้ไขหรือลบไม่ได้', 409);
  }

  private lockout(): DomainException {
    return new DomainException('IAM_LOCKOUT', LOCKOUT_MESSAGE, 409, { reason: 'last_manager' });
  }

  private notFound(message: string): DomainException {
    return new DomainException('NOT_FOUND', message, 404);
  }
}
