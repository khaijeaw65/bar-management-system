import { randomUUID } from 'node:crypto';
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { IMAGE_MAX_BYTES, type ImageContentType } from '@bar/contracts';
import { StorageConfigService } from '../../providers/config/storage/config.service.js';

/** Presigned POST lifetime (DR-020). */
export const UPLOAD_URL_TTL_SECONDS = 300;
/** Presigned GET lifetime (DR-020). */
export const READ_URL_TTL_SECONDS = 3600;

export const IMAGE_EXTENSION: Readonly<Record<ImageContentType, string>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Shape of a key `presignUpload` hands out; anything else under `tmp/` was not issued by us. */
export const TMP_KEY_PATTERN = /^tmp\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

export interface PresignedUpload {
  url: string;
  fields: Record<string, string>;
  key: string;
}

export interface StoredObject {
  size: number;
  contentType: string | undefined;
}

/**
 * The only code that talks to S3 (DR-020). The bucket stays private: uploads go through a
 * presigned POST whose policy S3 enforces, reads through a short-lived presigned GET.
 */
@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  public constructor(config: StorageConfigService) {
    this.bucket = config.bucket;
    // Keys only when both are set (local dev); otherwise the default chain (ECS task role).
    this.client = new S3Client({ region: config.region, credentials: config.credentials });
  }

  /** A `tmp/<uuid>.<ext>` slot that accepts exactly one content type, 1 byte … 5 MB. */
  public async presignUpload(contentType: ImageContentType): Promise<PresignedUpload> {
    const key = `tmp/${randomUUID()}.${IMAGE_EXTENSION[contentType]}`;
    const { url, fields } = await createPresignedPost(this.client, {
      Bucket: this.bucket,
      Key: key,
      Expires: UPLOAD_URL_TTL_SECONDS,
      Fields: { 'Content-Type': contentType },
      Conditions: [
        ['eq', '$Content-Type', contentType],
        ['content-length-range', 1, IMAGE_MAX_BYTES],
      ],
    });
    return { url, fields, key };
  }

  /** Null when the object does not exist (never uploaded, or past the `tmp/` lifecycle). */
  public async head(key: string): Promise<StoredObject | null> {
    try {
      const found = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return { size: found.ContentLength ?? 0, contentType: found.ContentType };
    } catch (error) {
      if (this.isNotFound(error)) return null;
      throw error;
    }
  }

  public async copy(from: string, to: string): Promise<void> {
    await this.client.send(
      new CopyObjectCommand({ Bucket: this.bucket, Key: to, CopySource: `${this.bucket}/${from}` }),
    );
  }

  public async remove(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  public presignRead(key: string): Promise<string> {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: READ_URL_TTL_SECONDS,
    });
  }

  private isNotFound(error: unknown): boolean {
    const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    return status === 404 || (error as { name?: string }).name === 'NotFound';
  }
}
