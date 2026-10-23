import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import {
  MENU_CHANGED,
  type CreateImageUploadUrl,
  type CreateMenuCategory,
  type CreateMenuItem,
  type ImageUploadUrl,
  type MenuCategory,
  type MenuCategoryList,
  type MenuChangedPayload,
  type MenuItem,
  type ReorderMenuCategories,
  type UpdateMenuCategory,
  type UpdateMenuItem,
} from '@bar/contracts';
import { CLOCK, type Clock } from '../../../common/clock.js';
import { DomainException } from '../../../common/domain-exception.js';
import { fromSatang, toSatang } from '../../../common/money.js';
import { StorageService, UPLOAD_URL_TTL_SECONDS } from '../../../common/storage/storage.service.js';
import { NotificationsService } from '../../notifications/notifications.service.js';
import {
  MENU_WRITE_REPOSITORY,
  type MenuItemFields,
  type MenuWriteRepository,
} from '../domain/menu-write.repository.js';
import { MenuCatalogService } from './menu-catalog.service.js';
import { MenuPhotoService, type AttachedPhoto } from './menu-photo.service.js';

/**
 * Manager menu edits (BRIEF-038). Each write is one transaction; `menu.changed` goes out after the
 * commit, so a rolled-back write never makes the POS refetch.
 */
@Injectable()
export class MenuWriteService {
  public constructor(
    @Inject(MENU_WRITE_REPOSITORY) private readonly menu: MenuWriteRepository,
    private readonly catalog: MenuCatalogService,
    private readonly notifications: NotificationsService,
    private readonly photos: MenuPhotoService,
    private readonly storage: StorageService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** A 5-minute presigned POST into `tmp/`; no DB write, no event. */
  public async createImageUploadUrl(input: CreateImageUploadUrl): Promise<ImageUploadUrl> {
    const upload = await this.storage.presignUpload(input.contentType);
    return { ...upload, expiresAt: new Date(this.clock.now().getTime() + UPLOAD_URL_TTL_SECONDS * 1000).toISOString() };
  }

  public async createItem(input: CreateMenuItem): Promise<MenuItem> {
    // A new item has no current photo, so only a `tmp/` upload can be attached.
    if (input.imageKey && !this.photos.isTmpKey(input.imageKey)) throw this.foreignImageKey();
    const id = randomUUID();
    // The copy happens before the transaction opens; no S3 call runs while a row lock is held.
    const photo = await this.attachPhoto(id, input.imageKey);
    try {
      await this.insertItem(id, input, photo?.key ?? null);
    } catch (error) {
      await this.photos.discard(photo);
      throw error;
    }
    await this.photos.release(photo?.tmpKey);
    this.changed({ itemIds: [id] });
    return this.catalog.getItem(id);
  }

  public async updateItem(id: string, input: UpdateMenuItem): Promise<MenuItem> {
    const photo = await this.attachPhoto(id, input.imageKey);
    let replaced: string | null;
    try {
      replaced = await this.saveItem(id, input, photo);
    } catch (error) {
      await this.photos.discard(photo);
      throw error;
    }
    await this.photos.release(photo?.tmpKey, replaced);
    this.changed({ itemIds: [id] });
    return this.catalog.getItem(id);
  }

  public async createCategory(input: CreateMenuCategory): Promise<MenuCategory> {
    const category = await this.insertCategory(input.name);
    this.changed({ categoryIds: [category.id] });
    return category;
  }

  public async updateCategory(id: string, input: UpdateMenuCategory): Promise<MenuCategory> {
    const category = await this.saveCategory(id, input);
    this.changed({ categoryIds: [id] });
    return category;
  }

  public async reorderCategories(input: ReorderMenuCategories): Promise<MenuCategoryList> {
    await this.saveOrder(input.ids);
    this.changed({ categoryIds: input.ids });
    return this.catalog.listCategories();
  }

  public async deleteCategory(id: string): Promise<{ ok: true }> {
    await this.removeCategory(id);
    this.changed({ categoryIds: [id] });
    return { ok: true };
  }

  /** A `tmp/` key is checked and copied; null / omitted need no S3 call; anything else is judged later. */
  private async attachPhoto(itemId: string, imageKey: string | null | undefined): Promise<AttachedPhoto | null> {
    return imageKey && this.photos.isTmpKey(imageKey) ? this.photos.attach(itemId, imageKey) : null;
  }

  @Transactional()
  private async insertItem(id: string, input: CreateMenuItem, imageKey: string | null): Promise<void> {
    await this.requireReferences(input.categoryId, input.modifierGroupIds ?? []);
    await this.menu.insertItem(id, this.fields(input, imageKey), input.variants, input.modifierGroupIds ?? []);
  }

  /** Returns the old photo's key when this save replaced or removed it, for deletion after commit. */
  @Transactional()
  private async saveItem(id: string, input: UpdateMenuItem, photo: AttachedPhoto | null): Promise<string | null> {
    const locked = await this.menu.lockItem(id);
    if (!locked) throw new DomainException('NOT_FOUND', 'ไม่พบเมนู', 404);
    if (Date.parse(input.updatedAt) < locked.updatedAt.getTime()) {
      // Read outside the row lock's transaction is fine: a plain SELECT is not blocked by FOR UPDATE.
      throw new DomainException('MENU_ITEM_STALE', 'มีคนบันทึกเมนูนี้ก่อน โหลดใหม่แล้วแก้อีกครั้ง', 409, {
        details: await this.catalog.getItem(id),
      });
    }
    const own = new Set(locked.variantIds);
    if (input.variants.some((variant) => variant.id !== undefined && !own.has(variant.id))) {
      throw new DomainException('VALIDATION_ERROR', 'ตัวเลือกราคาไม่ใช่ของเมนูนี้', 400);
    }
    const groupIds = input.modifierGroupIds ?? locked.groupIds;
    await this.requireReferences(input.categoryId, input.modifierGroupIds ?? []);
    const imageKey = this.nextImageKey(input.imageKey, locked.imageKey, photo);
    await this.menu.updateItem(id, this.fields(input, imageKey), input.variants, groupIds);
    return locked.imageKey !== null && locked.imageKey !== imageKey ? locked.imageKey : null;
  }

  /** omitted → keep · null → remove · attached `tmp/` → replace · the current key → keep · else 400. */
  private nextImageKey(requested: string | null | undefined, current: string | null, photo: AttachedPhoto | null): string | null {
    if (requested === undefined) return current;
    if (requested === null) return null;
    if (photo) return photo.key;
    if (requested === current) return current;
    throw this.foreignImageKey();
  }

  private foreignImageKey(): DomainException {
    return new DomainException('VALIDATION_ERROR', 'รูปไม่ถูกต้อง อัปโหลดรูปใหม่อีกครั้ง', 400);
  }

  @Transactional()
  private async insertCategory(name: string): Promise<MenuCategory> {
    return this.menu.insertCategory(name);
  }

  @Transactional()
  private async saveCategory(id: string, input: UpdateMenuCategory): Promise<MenuCategory> {
    const saved = await this.menu.saveCategory(id, input);
    if (!saved) throw this.categoryNotFound();
    return saved;
  }

  /**
   * `ids` must hold every visible category once; hidden ones may be left out (the POS list does
   * not show them) and keep their relative order after the listed ones.
   */
  @Transactional()
  private async saveOrder(ids: readonly string[]): Promise<void> {
    const current = await this.menu.lockCategoryOrder();
    const known = new Set(current.map((row) => row.id));
    if (ids.some((id) => !known.has(id))) throw this.categoryNotFound();
    const listed = new Set(ids);
    if (current.some((row) => row.isActive && !listed.has(row.id))) {
      throw new DomainException('VALIDATION_ERROR', 'ต้องเรียงทุกหมวดที่แสดงอยู่', 400);
    }
    const rest = current.filter((row) => !listed.has(row.id)).map((row) => row.id);
    await this.menu.saveCategoryOrder([...ids, ...rest]);
  }

  @Transactional()
  private async removeCategory(id: string): Promise<void> {
    const items = await this.menu.lockCategoryItemCount(id);
    if (items === null) throw this.categoryNotFound();
    if (items > 0) {
      throw new DomainException('CATEGORY_NOT_EMPTY', 'หมวดนี้ยังมีเมนูอยู่ ย้ายหรือซ่อนหมวดแทน', 409);
    }
    await this.menu.deleteCategory(id);
  }

  private async requireReferences(categoryId: string, groupIds: readonly string[]): Promise<void> {
    if (!(await this.menu.holdCategory(categoryId))) throw this.categoryNotFound();
    if ((await this.menu.missingModifierGroups(groupIds)).length > 0) {
      throw new DomainException('VALIDATION_ERROR', 'ไม่พบกลุ่มตัวเลือก', 400);
    }
  }

  private fields(input: CreateMenuItem | UpdateMenuItem, imageKey: string | null): MenuItemFields {
    return {
      categoryId: input.categoryId,
      name: input.name,
      description: input.description || null,
      imageKey,
      itemType: input.itemType,
      kitchenTag: input.station,
      isPromo: input.isPromo,
      basePrice: fromSatang(Math.min(...input.variants.map((variant) => toSatang(variant.price)))),
    };
  }

  private changed(payload: MenuChangedPayload): void {
    this.notifications.emitToStaff(MENU_CHANGED, payload);
  }

  private categoryNotFound(): DomainException {
    return new DomainException('NOT_FOUND', 'ไม่พบหมวด', 404);
  }
}
