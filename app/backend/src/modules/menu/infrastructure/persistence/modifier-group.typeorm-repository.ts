import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { In } from 'typeorm';
import type { ModifierGroupAdmin } from '@bar/contracts';
import type {
  ModifierGroupFields,
  ModifierGroupRepository,
  ModifierOptionFields,
} from '../../domain/modifier-group.repository.js';
import { ModifierGroup } from './modifier-group.entity.js';
import { ModifierOption } from './modifier-option.entity.js';

const LOCK_GROUP = `SELECT id FROM modifier_group WHERE id = $1 AND is_active FOR UPDATE`;

const USED_BY = `
  SELECT l.modifier_group_id AS "groupId", COUNT(DISTINCT v.menu_item_id) AS items
  FROM menu_variant_modifier_group l
  JOIN menu_item_variant v ON v.id = l.menu_item_variant_id
  WHERE v.is_available AND l.modifier_group_id = ANY($1::uuid[])
  GROUP BY l.modifier_group_id
`;

const LINKED_ITEMS = `
  SELECT DISTINCT v.menu_item_id AS id
  FROM menu_variant_modifier_group l
  JOIN menu_item_variant v ON v.id = l.menu_item_variant_id
  WHERE v.is_available AND l.modifier_group_id = $1
`;

@Injectable()
export class ModifierGroupTypeormRepository implements ModifierGroupRepository {
  public constructor(private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>) {}

  public async listActive(): Promise<ModifierGroupAdmin[]> {
    const groups = await this.txHost.tx.getRepository(ModifierGroup).find({
      where: { isActive: true },
      order: { name: 'ASC', id: 'ASC' },
    });
    return this.assemble(groups);
  }

  public async findActive(id: string): Promise<ModifierGroupAdmin | null> {
    const group = await this.txHost.tx.getRepository(ModifierGroup).findOne({ where: { id, isActive: true } });
    return group ? (await this.assemble([group]))[0] ?? null : null;
  }

  public async lock(id: string): Promise<string[] | null> {
    if ((await this.query(LOCK_GROUP, [id])).length === 0) return null;
    const options = await this.txHost.tx.getRepository(ModifierOption).find({
      select: { id: true },
      where: { groupId: id },
    });
    return options.map((option) => option.id);
  }

  public async insert(fields: ModifierGroupFields, options: readonly ModifierOptionFields[]): Promise<string> {
    const groups = this.txHost.tx.getRepository(ModifierGroup);
    const saved = await groups.save(groups.create({ ...fields, isActive: true }));
    await this.saveOptions(saved.id, options, []);
    return saved.id;
  }

  public async update(id: string, fields: ModifierGroupFields, options: readonly ModifierOptionFields[]): Promise<void> {
    const groups = this.txHost.tx.getRepository(ModifierGroup);
    const group = await groups.findOneOrFail({ where: { id } });
    Object.assign(group, fields);
    await groups.save(group);
    const existing = await this.txHost.tx.getRepository(ModifierOption).find({ where: { groupId: id } });
    await this.saveOptions(id, options, existing);
  }

  public async linkedItemIds(id: string): Promise<string[]> {
    return (await this.query(LINKED_ITEMS, [id])).map((row) => String(row.id));
  }

  public async archive(id: string): Promise<void> {
    const groups = this.txHost.tx.getRepository(ModifierGroup);
    const group = await groups.findOneOrFail({ where: { id } });
    group.isActive = false;
    await groups.save(group);
  }

  /** Order lines reference options, so a dropped one is switched off, never deleted (DR-024). */
  private async saveOptions(
    groupId: string,
    options: readonly ModifierOptionFields[],
    existing: readonly ModifierOption[],
  ): Promise<void> {
    const repository = this.txHost.tx.getRepository(ModifierOption);
    const byId = new Map(existing.map((option) => [option.id, option]));
    const listed = new Set(options.flatMap((option) => (option.id ? [option.id] : [])));
    // One transaction shares one NOW(); spreading new rows by a millisecond keeps the form's order (read order is created_at, id).
    const base = Date.now();
    const rows = options.map((input, index) => {
      const row = (input.id ? byId.get(input.id) : undefined) ?? repository.create({ groupId, createdAt: new Date(base + index) });
      row.name = input.name;
      row.priceDelta = input.priceDelta;
      row.isAvailable = true;
      return row;
    });
    const dropped = existing.filter((option) => !listed.has(option.id) && option.isAvailable);
    for (const row of dropped) row.isAvailable = false;
    await repository.save([...rows, ...dropped]);
  }

  private async assemble(groups: readonly ModifierGroup[]): Promise<ModifierGroupAdmin[]> {
    if (groups.length === 0) return [];
    const ids = groups.map((group) => group.id);
    const options = await this.txHost.tx.getRepository(ModifierOption).find({
      where: { groupId: In(ids) },
      order: { createdAt: 'ASC', id: 'ASC' },
    });
    const used = new Map((await this.query(USED_BY, [ids])).map((row) => [String(row.groupId), Number(row.items)]));
    return groups.map((group) => ({
      id: group.id,
      name: group.name,
      isRequired: group.isRequired,
      minSelect: group.minSelect,
      maxSelect: group.maxSelect,
      options: options
        .filter((option) => option.groupId === group.id)
        .map((option) => ({
          id: option.id,
          name: option.name,
          priceDelta: String(option.priceDelta),
          isAvailable: option.isAvailable,
        })),
      usedByItems: used.get(group.id) ?? 0,
    }));
  }

  private async query(sql: string, parameters: unknown[]): Promise<Record<string, unknown>[]> {
    const result: unknown = await this.txHost.tx.query(sql, parameters);
    return Array.isArray(result) ? (result as Record<string, unknown>[]) : [];
  }
}
