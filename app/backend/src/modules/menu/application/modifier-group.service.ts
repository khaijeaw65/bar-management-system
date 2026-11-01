import { Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import {
  MENU_CHANGED,
  type CreateModifierGroup,
  type MenuChangedPayload,
  type ModifierGroupAdmin,
  type ModifierGroupAdminList,
  type UpdateModifierGroup,
} from '@bar/contracts';
import { DomainException } from '../../../common/domain-exception.js';
import { NotificationsService } from '../../notifications/notifications.service.js';
import { ModifierGroupRepository } from '../domain/modifier-group.repository.js';

/**
 * Manager edits of add-on groups (BRIEF-044). One transaction per write; `menu.changed` goes out
 * after the commit. "Delete" archives (DR-024): past orders keep pointing at the options.
 */
@Injectable()
export class ModifierGroupService {
  public constructor(
    private readonly groups: ModifierGroupRepository,
    private readonly notifications: NotificationsService,
  ) {}

  public async list(): Promise<ModifierGroupAdminList> {
    return { items: await this.groups.listActive() };
  }

  public async create(input: CreateModifierGroup): Promise<ModifierGroupAdmin> {
    const group = await this.insertGroup(input);
    this.changed({ itemIds: [] });
    return group;
  }

  public async update(id: string, input: UpdateModifierGroup): Promise<ModifierGroupAdmin> {
    const { group, itemIds } = await this.saveGroup(id, input);
    this.changed({ itemIds });
    return group;
  }

  public async archive(id: string): Promise<{ ok: true }> {
    await this.archiveGroup(id);
    this.changed({ itemIds: [] });
    return { ok: true };
  }

  @Transactional()
  private async insertGroup(input: CreateModifierGroup): Promise<ModifierGroupAdmin> {
    const id = await this.groups.insert(input, input.options);
    return this.read(id);
  }

  @Transactional()
  private async saveGroup(id: string, input: UpdateModifierGroup): Promise<{ group: ModifierGroupAdmin; itemIds: string[] }> {
    const own = new Set(await this.requireLocked(id));
    if (input.options.some((option) => option.id !== undefined && !own.has(option.id))) {
      throw new DomainException('VALIDATION_ERROR', 'ตัวเลือกไม่ใช่ของกลุ่มนี้', 400);
    }
    await this.groups.update(id, input, input.options);
    return { group: await this.read(id), itemIds: await this.groups.linkedItemIds(id) };
  }

  /** The group is locked `FOR UPDATE` before the count, so an item write cannot link it in between. */
  @Transactional()
  private async archiveGroup(id: string): Promise<void> {
    await this.requireLocked(id);
    const used = (await this.groups.linkedItemIds(id)).length;
    if (used > 0) {
      throw new DomainException('MODIFIER_GROUP_IN_USE', `ใช้อยู่ใน ${used} เมนู — ถอดออกจากเมนูก่อน`, 409);
    }
    await this.groups.archive(id);
  }

  private async requireLocked(id: string): Promise<string[]> {
    const optionIds = await this.groups.lock(id);
    if (!optionIds) throw new DomainException('NOT_FOUND', 'ไม่พบกลุ่มตัวเลือก', 404);
    return optionIds;
  }

  private async read(id: string): Promise<ModifierGroupAdmin> {
    const group = await this.groups.findActive(id);
    if (!group) throw new DomainException('NOT_FOUND', 'ไม่พบกลุ่มตัวเลือก', 404);
    return group;
  }

  private changed(payload: MenuChangedPayload): void {
    this.notifications.emitToStaff(MENU_CHANGED, payload);
  }
}
