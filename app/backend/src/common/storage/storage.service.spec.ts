import { S3Client } from '@aws-sdk/client-s3';
import { IMAGE_MAX_BYTES } from '@bar/contracts';
import type { StorageConfigService } from '../../providers/config/storage/config.service.js';
import { StorageService } from './storage.service.js';

const config = {
  region: 'ap-southeast-1',
  bucket: 'bar-test',
  credentials: { accessKeyId: 'AKIAEXAMPLE', secretAccessKey: 'example-secret' },
} as StorageConfigService;

interface Policy {
  conditions: Array<unknown[] | Record<string, string>>;
}

function policyOf(fields: Record<string, string>): Policy {
  return JSON.parse(Buffer.from(fields.Policy ?? fields.policy ?? '', 'base64').toString('utf8')) as Policy;
}

describe('StorageService.presignUpload', () => {
  const storage = new StorageService(config);

  it.each([
    ['image/jpeg', 'jpg'],
    ['image/png', 'png'],
    ['image/webp', 'webp'],
  ] as const)('%s → a tmp/ key with the exact type and the 1 … 5 MB range in the policy', async (type, ext) => {
    const upload = await storage.presignUpload(type);
    expect(upload.key).toMatch(new RegExp(`^tmp/[0-9a-f-]{36}\\.${ext}$`));
    expect(upload.url).toContain('bar-test');
    expect(upload.fields['Content-Type']).toBe(type);
    const { conditions } = policyOf(upload.fields);
    expect(conditions).toContainEqual(['eq', '$Content-Type', type]);
    expect(conditions).toContainEqual(['content-length-range', 1, IMAGE_MAX_BYTES]);
    expect(conditions).toContainEqual({ key: upload.key });
    expect(IMAGE_MAX_BYTES).toBe(5_242_880);
  });

  it('expires the policy in 5 minutes', async () => {
    const before = Date.now();
    const upload = await storage.presignUpload('image/png');
    const expiration = JSON.parse(Buffer.from(upload.fields.Policy ?? '', 'base64').toString('utf8')) as {
      expiration: string;
    };
    const seconds = (Date.parse(expiration.expiration) - before) / 1000;
    expect(seconds).toBeGreaterThan(290);
    expect(seconds).toBeLessThanOrEqual(301);
  });
});

describe('StorageService reads and lookups', () => {
  const storage = new StorageService(config);

  afterEach(() => vi.restoreAllMocks());

  it('signs a one-hour GET for the key without calling S3', async () => {
    const send = vi.spyOn(S3Client.prototype, 'send');
    const url = new URL(await storage.presignRead('menu/abc/photo.jpg'));
    expect(url.pathname).toContain('menu/abc/photo.jpg');
    expect(url.searchParams.get('X-Amz-Expires')).toBe('3600');
    expect(send).not.toHaveBeenCalled();
  });

  it('head returns size and type, and null for a missing object', async () => {
    const send = vi
      .spyOn(S3Client.prototype, 'send')
      .mockImplementationOnce(async () => ({ ContentLength: 1234, ContentType: 'image/jpeg' }))
      .mockImplementationOnce(async () => {
        throw Object.assign(new Error('missing'), { name: 'NotFound', $metadata: { httpStatusCode: 404 } });
      })
      .mockImplementationOnce(async () => {
        throw Object.assign(new Error('denied'), { name: 'Forbidden', $metadata: { httpStatusCode: 403 } });
      });
    expect(await storage.head('tmp/a.jpg')).toEqual({ size: 1234, contentType: 'image/jpeg' });
    expect(await storage.head('tmp/b.jpg')).toBeNull();
    await expect(storage.head('tmp/c.jpg')).rejects.toThrow('denied');
    expect(send).toHaveBeenCalledTimes(3);
  });
});
