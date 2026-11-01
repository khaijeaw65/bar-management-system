import { randomUUID } from 'node:crypto';
import type { ImageContentType } from '@bar/contracts';
import {
  IMAGE_EXTENSION,
  type StorageService,
} from '../src/common/storage/storage.service.js';
import type { PresignedUpload, StoredObject } from '../src/common/storage/storage.types.js';

type StorageApi = Pick<StorageService, 'presignUpload' | 'head' | 'copy' | 'remove' | 'presignRead'>;

/** In-memory stand-in for `StorageService`: tests run with no AWS keys and no network. */
export class FakeStorage implements StorageApi {
  public readonly objects = new Map<string, StoredObject>();
  public failCopy = false;
  public failRemove = false;
  public failRead = false;

  public async presignUpload(contentType: ImageContentType): Promise<PresignedUpload> {
    const key = `tmp/${randomUUID()}.${IMAGE_EXTENSION[contentType]}`;
    return { url: 'https://fake-s3.test/bar-test', fields: { 'Content-Type': contentType, key }, key };
  }

  /** What the browser's POST to the presigned URL would leave in the bucket. */
  public upload(key: string, size: number, contentType: string): void {
    this.objects.set(key, { size, contentType });
  }

  public async head(key: string): Promise<StoredObject | null> {
    return this.objects.get(key) ?? null;
  }

  public async copy(from: string, to: string): Promise<void> {
    if (this.failCopy) throw new Error('copy failed');
    const source = this.objects.get(from);
    if (!source) throw new Error('NoSuchKey');
    this.objects.set(to, { ...source });
  }

  public async remove(key: string): Promise<void> {
    if (this.failRemove) throw new Error('delete failed');
    this.objects.delete(key);
  }

  public async presignRead(key: string): Promise<string> {
    if (this.failRead) throw new Error('credentials unavailable');
    return `https://fake-s3.test/bar-test/${key}?X-Amz-Signature=fake`;
  }

  public keys(prefix: string): string[] {
    return [...this.objects.keys()].filter((key) => key.startsWith(prefix)).sort();
  }
}

export function asStorage(fake: FakeStorage): StorageService {
  return fake as unknown as StorageService;
}
