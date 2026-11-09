import { Injectable } from '@nestjs/common';
import type {
  AccessRequest,
  ApproveAccessRequest,
  EffectivePermissions,
  MembershipInput,
  StaffMember,
  UpdateStaff,
} from '@bar/contracts';
import { DomainException } from '../../../common/domain-exception.js';
import { TokenService } from '../../auth/application/token.service.js';
import { VenueSettingsService } from '../../venue/application/venue-settings.service.js';
import { StaffAdminRepository } from '../domain/staff-admin.repository.js';
import type {
  MembershipWrite,
  StaffWriteOutcome,
} from '../domain/staff-admin.types.js';
import { toAccessRequest, toStaffMember } from './staff-admin.mapper.js';
import { IamVersion } from './iam-version.service.js';
import { needsCutoff, resolveUntil } from './membership-until.js';

const DECIDED_MESSAGE = 'คำขอนี้ถูกตัดสินแล้ว';
const LOCKOUT_MESSAGE = 'ต้องมีผู้ดูแลสิทธิ์อย่างน้อย 1 คนที่ไม่มีวันหมดอายุ';

@Injectable()
export class StaffAdminService {
  public constructor(
    private readonly repository: StaffAdminRepository,
    private readonly iamVersion: IamVersion,
    private readonly tokens: TokenService,
    private readonly venueSettings: VenueSettingsService,
  ) {}

  public async listRequests(status: 'pending' | 'rejected'): Promise<AccessRequest[]> {
    return (await this.repository.listRequests(status)).map(toAccessRequest);
  }

  public async approve(requestId: string, input: ApproveAccessRequest, actorId: string): Promise<StaffMember> {
    const now = new Date();
    const memberships = await this.toWrites(input.memberships, now);
    const outcome = await this.repository.approveRequest(requestId, input.displayName, memberships, actorId, now);
    if (outcome.kind === 'not_found') throw this.notFound('ไม่พบคำขอ');
    if (outcome.kind === 'decided') throw new DomainException('ACCESS_REQUEST_DECIDED', DECIDED_MESSAGE, 409);
    if (outcome.kind === 'unknown_group') throw this.unknownGroup();
    await this.iamVersion.bump();
    return this.requireMember(outcome.userId, now);
  }

  public reject(requestId: string, actorId: string): Promise<AccessRequest> {
    return this.decide(requestId, 'pending', 'rejected', actorId);
  }

  public reopen(requestId: string, actorId: string): Promise<AccessRequest> {
    return this.decide(requestId, 'rejected', 'pending', actorId);
  }

  public async list(): Promise<StaffMember[]> {
    const now = new Date();
    return (await this.repository.listStaff()).map((row) => toStaffMember(row, now));
  }

  public get(id: string): Promise<StaffMember> {
    return this.requireMember(id, new Date());
  }

  public async update(id: string, patch: UpdateStaff, actorId: string): Promise<StaffMember> {
    if (patch.isActive === false && id === actorId) {
      throw new DomainException('SELF_DEACTIVATE', 'ปิดบัญชีของตัวเองไม่ได้', 409);
    }
    const now = new Date();
    const outcome = await this.repository.updateStaff(id, patch, now);
    await this.finishWrite(outcome);
    if (patch.isActive === false) await this.tokens.revokeAllForUser(id);
    return this.requireMember(id, now);
  }

  public async replaceMemberships(id: string, inputs: MembershipInput[]): Promise<StaffMember> {
    const now = new Date();
    const memberships = await this.toWrites(inputs, now);
    await this.finishWrite(await this.repository.replaceMemberships(id, memberships, now));
    return this.requireMember(id, now);
  }

  public async replacePolicies(id: string, policyIds: string[]): Promise<StaffMember> {
    const now = new Date();
    await this.finishWrite(await this.repository.replacePolicies(id, [...new Set(policyIds)], now));
    return this.requireMember(id, now);
  }

  public async effectivePermissions(id: string): Promise<EffectivePermissions> {
    const now = new Date();
    await this.requireMember(id, now);
    const rows = await this.repository.permissionSources(id, now);
    const byCode = new Map<string, EffectivePermissions['permissions'][number]>();
    for (const row of rows) {
      const entry = byCode.get(row.code) ?? { code: row.code, sources: [] };
      entry.sources.push({
        kind: row.kind,
        ...(row.groupName === null ? {} : { groupName: row.groupName }),
        policyName: row.policyName,
      });
      byCode.set(row.code, entry);
    }
    return { permissions: [...byCode.values()] };
  }

  private async decide(
    requestId: string,
    from: 'pending' | 'rejected',
    to: 'pending' | 'rejected',
    actorId: string,
  ): Promise<AccessRequest> {
    const outcome = await this.repository.decideRequest(requestId, from, to, actorId, new Date());
    if (outcome.kind === 'not_found') throw this.notFound('ไม่พบคำขอ');
    if (outcome.kind === 'wrong_state') throw new DomainException('ACCESS_REQUEST_DECIDED', DECIDED_MESSAGE, 409);
    await this.iamVersion.bump();
    return toAccessRequest(outcome.request);
  }

  private async finishWrite(outcome: StaffWriteOutcome): Promise<void> {
    if (outcome.kind === 'not_found') throw this.notFound('ไม่พบพนักงาน');
    if (outcome.kind === 'unknown_group') throw this.unknownGroup();
    if (outcome.kind === 'unknown_policy') {
      throw new DomainException('VALIDATION_ERROR', 'ไม่พบนโยบายที่เลือก', 400);
    }
    if (outcome.kind === 'lockout') {
      throw new DomainException('IAM_LOCKOUT', LOCKOUT_MESSAGE, 409, { reason: 'last_manager' });
    }
    await this.iamVersion.bump();
  }

  private async requireMember(id: string, now: Date): Promise<StaffMember> {
    const row = await this.repository.findStaff(id);
    if (!row) throw this.notFound('ไม่พบพนักงาน');
    return toStaffMember(row, now);
  }

  private async toWrites(inputs: MembershipInput[], now: Date): Promise<MembershipWrite[]> {
    const ids = inputs.map((input) => input.groupId);
    if (new Set(ids).size !== ids.length) {
      throw new DomainException('VALIDATION_ERROR', 'เลือกกลุ่มซ้ำกัน', 400);
    }
    const cutoff = needsCutoff(inputs) ? (await this.venueSettings.get()).businessDayCutoff : '06:00';
    return inputs.map((input) => ({
      groupId: input.groupId,
      validUntil: resolveUntil(input.until, now, cutoff),
    }));
  }

  private notFound(message: string): DomainException {
    return new DomainException('NOT_FOUND', message, 404);
  }

  private unknownGroup(): DomainException {
    return new DomainException('VALIDATION_ERROR', 'ไม่พบกลุ่มที่เลือก', 400);
  }
}
