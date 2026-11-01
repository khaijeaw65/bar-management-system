import { Injectable, Logger } from '@nestjs/common';
import type {
  MenuCategoryList,
  MenuItem,
  MenuItemList,
  MenuModifierGroup,
} from '@bar/contracts';
import { StorageService } from '../../../common/storage/storage.service.js';
import { hhmm } from '../../../common/time-label.js';
import { DomainException } from '../../../common/domain-exception.js';
import { Clock } from '../../../common/clock.js';
import { MenuCatalogRepository } from '../domain/menu-catalog.repository.js';
import type {
  MenuGroupRecord,
  MenuItemRecord,
  MenuVariantRecord,
} from '../domain/menu.types.js';
import { menuAvailability } from './menu-availability.js';
import type { MenuListQuery, OrderableLookup, OrderableVariant } from './menu-catalog.types.js';
import { money } from '../../../common/money.js';

@Injectable()
export class MenuCatalogService {
  private readonly logger = new Logger(MenuCatalogService.name);

  public constructor(
    private readonly catalog: MenuCatalogRepository,
    private readonly clock: Clock,
    private readonly storage: StorageService,
  ) {}

  public async listCategories(includeHidden = false): Promise<MenuCategoryList> {
    return { items: await this.catalog.listCategories(includeHidden) };
  }

  public async listItems(query: MenuListQuery): Promise<MenuItemList> {
    const now = this.clock.now();
    const records = await this.catalog.listItems(query.categoryId, query.includeHidden);
    const listed = records.filter(
      (record) => query.includeHidden || menuAvailability(this.availabilityInput(record), now).listed,
    );
    const items = await Promise.all(listed.map((record) => this.toItem(record, now)));
    return {
      items: query.availableOnly
        ? items.filter((item) => item.availableNow)
        : items,
    };
  }

  public async getItem(id: string): Promise<MenuItem> {
    const record = await this.catalog.findItem(id);
    if (!record) throw new DomainException('NOT_FOUND', 'ไม่พบเมนู', 404);
    return await this.toItem(record, this.clock.now());
  }

  public async setAvailability(
    itemId: string,
    available: boolean,
  ): Promise<{ changed: boolean; item: MenuItem }> {
    const locked = await this.catalog.lockItem(itemId);
    if (!locked) throw new DomainException('NOT_FOUND', 'ไม่พบเมนู', 404);
    if (locked.isAvailable === available) {
      return { changed: false, item: await this.toItem(locked, this.clock.now()) };
    }
    const updatedAt = await this.catalog.saveAvailability(itemId, available);
    return {
      changed: true,
      item: await this.toItem({ ...locked, isAvailable: available, updatedAt }, this.clock.now()),
    };
  }

  /**
   * Always reads the database. Order prices must not come from a cache.
   * An id that is not a variant is listed in `missing` and does not throw.
   * `lock: 'share'` holds the menu rows until the caller's transaction ends.
   */
  public async getOrderable(
    variantIds: readonly string[],
    now: Date,
    options?: { lock?: 'share' },
  ): Promise<OrderableLookup> {
    const ordered = [...new Set(variantIds)];
    const flags = options?.lock === 'share' ? await this.catalog.shareItems(ordered) : null;
    const records = (await this.catalog.findVariants(ordered)).map((record) =>
      this.withFlag(record, flags),
    );
    const byVariant = new Map<
      string,
      { record: MenuItemRecord; variant: MenuVariantRecord }
    >();
    for (const record of records) {
      for (const variant of record.variants) {
        byVariant.set(variant.id, { record, variant });
      }
    }
    const found: OrderableVariant[] = [];
    const missing: string[] = [];
    for (const id of ordered) {
      const hit = byVariant.get(id);
      if (!hit) {
        missing.push(id);
        continue;
      }
      found.push(this.toOrderable(hit.record, hit.variant, now));
    }
    return { found, missing };
  }

  private withFlag(
    record: MenuItemRecord,
    flags: ReadonlyMap<string, boolean> | null,
  ): MenuItemRecord {
    if (!flags) return record;
    const flag = flags.get(record.id);
    if (flag === undefined) return record;
    return { ...record, isAvailable: flag };
  }

  private async toItem(record: MenuItemRecord, now: Date): Promise<MenuItem> {
    const decision = menuAvailability(this.availabilityInput(record), now);
    return {
      id: record.id,
      categoryId: record.categoryId,
      name: record.name,
      description: record.description,
      imageUrl: await this.photoUrl(record.imageKey),
      itemType: record.itemType,
      station: record.kitchenTag,
      isPromo: record.isPromo,
      basePrice: money(record.basePrice),
      sortOrder: record.sortOrder,
      availableNow: decision.availableNow,
      unavailableReason: decision.unavailableReason,
      windows: record.windows.map((window) => ({
        daysOfWeek: window.daysOfWeek,
        startTime: hhmm(window.startTime),
        endTime: hhmm(window.endTime),
      })),
      variants: record.variants.map((variant) => ({
        id: variant.id,
        name: variant.name,
        price: money(variant.price),
        isAvailable: variant.isAvailable,
        modifierGroups: variant.modifierGroups.map((group) => this.toGroup(group)),
      })),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  /** A photo is decoration: a signing failure shows "no photo" and never fails a menu read or an 86. */
  private async photoUrl(imageKey: string | null): Promise<string | null> {
    if (!imageKey) return null;
    try {
      return await this.storage.presignRead(imageKey);
    } catch (error) {
      this.logger.warn(`could not sign ${imageKey}: ${error instanceof Error ? error.name : 'error'}`);
      return null;
    }
  }

  private toOrderable(
    record: MenuItemRecord,
    variant: MenuVariantRecord,
    now: Date,
  ): OrderableVariant {
    const decision = menuAvailability(this.availabilityInput(record), now);
    // A turned-off variant is sold out even when the item is also outside its window.
    const availableNow = decision.availableNow && variant.isAvailable;
    const unavailableReason = variant.isAvailable
      ? decision.unavailableReason
      : 'sold_out';
    return {
      variantId: variant.id,
      price: money(variant.price),
      itemName: record.name,
      variantName: variant.name,
      itemType: record.itemType,
      kitchenTag: record.kitchenTag,
      availableNow,
      unavailableReason,
      modifierGroups: variant.modifierGroups.map((group) => this.toGroup(group)),
    };
  }

  private availabilityInput(record: MenuItemRecord) {
    return {
      categoryActive: record.categoryActive,
      isAvailable: record.isAvailable,
      windows: record.windows,
    };
  }

  private toGroup(group: MenuGroupRecord): MenuModifierGroup {
    return {
      id: group.id,
      name: group.name,
      isRequired: group.isRequired,
      minSelect: group.minSelect,
      maxSelect: group.maxSelect,
      options: group.options.map((option) => ({
        id: option.id,
        name: option.name,
        priceDelta: money(option.priceDelta),
        isAvailable: option.isAvailable,
      })),
    };
  }
}
