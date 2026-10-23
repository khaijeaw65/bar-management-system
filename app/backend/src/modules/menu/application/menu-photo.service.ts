import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { IMAGE_MAX_BYTES, ImageContentTypeSchema } from '@bar/contracts';
import { DomainException } from '../../../common/domain-exception.js';
import { IMAGE_EXTENSION, StorageService, TMP_KEY_PATTERN } from '../../../common/storage/storage.service.js';

export interface AttachedPhoto {
  /** The permanent `menu/<itemId>/<uuid>.<ext>` key, already copied. */
  key: string;
  /** The upload slot to delete once the item row is committed. */
  tmpKey: string;
}

/**
 * Photo handling around an item write (DR-020): check what the browser uploaded, copy it to the
 * item's own folder before the DB write, and clean up after — never inside a DB transaction.
 */
@Injectable()
export class MenuPhotoService {
  private readonly logger = new Logger(MenuPhotoService.name);

  public constructor(private readonly storage: StorageService) {}

  /** Whether `key` names an upload slot (as opposed to the item's own `menu/…` photo). */
  public isTmpKey(key: string): boolean {
    return key.startsWith('tmp/');
  }

  /** Re-checks the uploaded object (S3 enforced the policy; the server verifies) and copies it. */
  public async attach(itemId: string, tmpKey: string): Promise<AttachedPhoto> {
    if (!TMP_KEY_PATTERN.test(tmpKey)) throw this.invalid('รูปไม่ถูกต้อง อัปโหลดรูปใหม่อีกครั้ง');
    const stored = await this.storage.head(tmpKey);
    if (!stored) throw this.invalid('ไม่พบรูปที่อัปโหลด หรือหมดอายุแล้ว อัปโหลดรูปใหม่อีกครั้ง');
    const type = ImageContentTypeSchema.safeParse(stored.contentType);
    if (!type.success) throw this.invalid('รองรับเฉพาะรูป JPG, PNG หรือ WebP');
    if (stored.size < 1 || stored.size > IMAGE_MAX_BYTES) throw this.invalid('รูปต้องมีขนาดไม่เกิน 5 MB');
    const key = `menu/${itemId}/${randomUUID()}.${IMAGE_EXTENSION[type.data]}`;
    await this.storage.copy(tmpKey, key);
    return { key, tmpKey };
  }

  /** The DB write failed: drop the copy so no object is left behind. */
  public async discard(photo: AttachedPhoto | null): Promise<void> {
    if (photo) await this.removeQuietly(photo.key);
  }

  /** After commit: the upload slot and the photo this write replaced or removed. */
  public async release(...keys: Array<string | null | undefined>): Promise<void> {
    for (const key of keys) if (key) await this.removeQuietly(key);
  }

  private async removeQuietly(key: string): Promise<void> {
    try {
      await this.storage.remove(key);
    } catch (error) {
      // The bucket's 1-day tmp/ lifecycle is the backstop for tmp keys; a stray menu/ object is harmless.
      this.logger.warn(`could not delete ${key}: ${error instanceof Error ? error.name : 'error'}`);
    }
  }

  private invalid(message: string): DomainException {
    return new DomainException('VALIDATION_ERROR', message, 400);
  }
}
