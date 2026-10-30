import { Injectable } from '@nestjs/common';
import type { CustomerMenu, MenuItem } from '@bar/contracts';
import { MenuCatalogService } from '../../menu/application/menu-catalog.service.js';

@Injectable()
export class CustomerMenuService {
  public constructor(private readonly catalog: MenuCatalogService) {}

  /**
   * Active categories only (hidden ones drop their items too). Sold-out and out-of-window items stay,
   * greyed by `availableNow` (FRD §9). Charge items never reach a guest (CD-06 §9).
   */
  public async get(): Promise<CustomerMenu> {
    const [categories, items] = await Promise.all([
      this.catalog.listCategories(false),
      this.catalog.listItems({ availableOnly: false }),
    ]);
    const guestItems = items.items.filter((item) => item.itemType !== 'charge').map((item) => this.toItem(item));
    const stocked = new Set(guestItems.map((item) => item.categoryId));
    return {
      categories: categories.items
        .filter((category) => category.isActive && stocked.has(category.id))
        .map(({ id, name, sortOrder }) => ({ id, name, sortOrder })),
      items: guestItems,
    };
  }

  private toItem(item: MenuItem): CustomerMenu['items'][number] {
    return {
      id: item.id,
      categoryId: item.categoryId,
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl,
      isPromo: item.isPromo,
      basePrice: item.basePrice,
      availableNow: item.availableNow,
      unavailableReason: item.unavailableReason,
      windows: item.windows,
      variants: item.variants,
    };
  }
}
