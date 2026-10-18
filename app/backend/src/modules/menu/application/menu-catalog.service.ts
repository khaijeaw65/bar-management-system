import { Inject, Injectable } from '@nestjs/common';
import type {
  MenuItem,
  MenuItemList,
  MenuModifierGroup,
  UnavailableReason,
} from '@bar/contracts';
import { hhmm } from '../../../common/time-label.js';
import { DomainException } from '../../../common/domain-exception.js';
import { CLOCK, type Clock } from '../../../common/clock.js';
import {
  MENU_CATALOG_REPOSITORY,
  type MenuCatalogRepository,
} from '../domain/menu-catalog.repository.js';
import type {
  MenuGroupRecord,
  MenuItemRecord,
  MenuVariantRecord,
} from '../domain/menu.types.js';
import { menuAvailability } from './menu-availability.js';
import { money } from '../../../common/money.js';

export interface MenuListQuery {
  categoryId?: string;
  availableOnly: boolean;
}

export interface OrderableVariant {
  variantId: string;
  price: string;
  itemName: string;
  variantName: string;
  itemType: MenuItem['itemType'];
  kitchenTag: MenuItemRecord['kitchenTag'];
  availableNow: boolean;
  unavailableReason: UnavailableReason | null;
  modifierGroups: MenuModifierGroup[];
}

export interface OrderableLookup {
  found: OrderableVariant[];
  missing: string[];
}

@Injectable()
export class MenuCatalogService {
  public constructor(
    @Inject(MENU_CATALOG_REPOSITORY)
    private readonly catalog: MenuCatalogRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  public async listCategories(): Promise<{
    items: Array<{ id: string; name: string; sortOrder: number }>;
  }> {
    return { items: await this.catalog.listCategories() };
  }

  public async listItems(query: MenuListQuery): Promise<MenuItemList> {
    const now = this.clock.now();
    const items = (await this.catalog.listItems(query.categoryId))
      .map((record) => this.toListedItem(record, now))
      .filter((item): item is MenuItem => item !== null);
    return {
      items: query.availableOnly
        ? items.filter((item) => item.availableNow)
        : items,
    };
  }

  public async getItem(id: string): Promise<MenuItem> {
    const record = await this.catalog.findItem(id);
    if (!record) throw new DomainException('NOT_FOUND', 'ไม่พบเมนู', 404);
    return this.toItem(record, this.clock.now());
  }

  /**
   * Always reads the database. Order prices must not come from a cache.
   * An id that is not a variant is listed in `missing` and does not throw.
   */
  public async getOrderable(
    variantIds: readonly string[],
    now: Date,
  ): Promise<OrderableLookup> {
    const ordered = [...new Set(variantIds)];
    const records = await this.catalog.findVariants(ordered);
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

  private toListedItem(record: MenuItemRecord, now: Date): MenuItem | null {
    if (!menuAvailability(this.availabilityInput(record), now).listed) return null;
    return this.toItem(record, now);
  }

  private toItem(record: MenuItemRecord, now: Date): MenuItem {
    const decision = menuAvailability(this.availabilityInput(record), now);
    return {
      id: record.id,
      categoryId: record.categoryId,
      name: record.name,
      description: record.description,
      imageUrl: null,
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
    };
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
