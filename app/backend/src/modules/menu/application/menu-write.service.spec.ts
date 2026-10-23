import type { CreateMenuItem, MenuItem, UpdateMenuItem } from '@bar/contracts';
import { asStorage, FakeStorage } from '../../../../test/fake-storage.js';
import type { NotificationsService } from '../../notifications/notifications.service.js';
import type { MenuWriteRepository } from '../domain/menu-write.repository.js';
import { MenuCatalogService } from './menu-catalog.service.js';
import { MenuPhotoService } from './menu-photo.service.js';
import { MenuWriteService } from './menu-write.service.js';

// The transaction itself is covered by the e2e suite; here the decorator only has to call through.
vi.mock('@nestjs-cls/transactional', () => ({
  Transactional: () => () => undefined,
}));

const CATEGORY = '11111111-1111-4111-8111-111111111111';
const ITEM = '22222222-2222-4222-8222-222222222222';
const NOW = new Date('2026-10-23T10:00:00.000Z');
const OLD_KEY = `menu/${ITEM}/00000000-0000-4000-8000-000000000000.jpg`;
const TMP_KEY = 'tmp/5b0c3f1e-8d2a-4c47-9a51-0e6f2b7d3c18.jpg';
const MB = 1024 * 1024;

const form = {
  categoryId: CATEGORY,
  name: 'จินโทนิค',
  itemType: 'simple',
  station: 'bar',
  isPromo: false,
  variants: [{ name: 'แก้ว', price: '180.00' }],
} satisfies CreateMenuItem;

function setup(current: { imageKey: string | null; updatedAt?: Date } = { imageKey: OLD_KEY }) {
  const storage = new FakeStorage();
  const repository = {
    holdCategory: vi.fn(async () => true),
    missingModifierGroups: vi.fn(async () => []),
    insertItem: vi.fn(async (_id: string, _fields: { imageKey: string | null }, ..._rest: unknown[]) => undefined),
    lockItem: vi.fn(async () => ({
      updatedAt: current.updatedAt ?? NOW,
      imageKey: current.imageKey,
      variantIds: [],
      groupIds: [],
    })),
    updateItem: vi.fn(async (_id: string, _fields: { imageKey: string | null }, ..._rest: unknown[]) => undefined),
  };
  const catalog = { getItem: vi.fn(async () => ({ id: ITEM }) as MenuItem) } as unknown as MenuCatalogService;
  const notifications = { emitToStaff: vi.fn() } as unknown as NotificationsService;
  const service = new MenuWriteService(
    repository as unknown as MenuWriteRepository,
    catalog,
    notifications,
    new MenuPhotoService(asStorage(storage)),
    asStorage(storage),
    { now: () => NOW },
  );
  return { storage, repository, service };
}

function uploaded(storage: FakeStorage, key = TMP_KEY, size = MB, type = 'image/jpeg'): void {
  storage.upload(key, size, type);
}

describe('MenuWriteService.createImageUploadUrl', () => {
  it('returns the presigned form and a 5-minute expiry, with no DB write', async () => {
    const { service, repository } = setup();
    const result = await service.createImageUploadUrl({ contentType: 'image/png' });
    expect(result.key).toMatch(/^tmp\/.+\.png$/);
    expect(result.fields['Content-Type']).toBe('image/png');
    expect(result.expiresAt).toBe('2026-10-23T10:05:00.000Z');
    expect(repository.insertItem).not.toHaveBeenCalled();
  });
});

describe('MenuWriteService.createItem photo', () => {
  it('copies the upload to menu/<itemId>/, saves that key and deletes the tmp object', async () => {
    const { service, storage, repository } = setup();
    uploaded(storage);
    await service.createItem({ ...form, imageKey: TMP_KEY });
    const [id, fields] = repository.insertItem.mock.calls[0] ?? [];
    if (!id || !fields?.imageKey) throw new Error('item was not saved with a photo');
    expect(fields.imageKey).toMatch(new RegExp(`^menu/${id}/[0-9a-f-]{36}\\.jpg$`));
    expect(storage.keys('')).toEqual([fields.imageKey]);
  });

  it('saves no photo when imageKey is omitted or null', async () => {
    const { service, repository, storage } = setup();
    await service.createItem(form);
    await service.createItem({ ...form, imageKey: null });
    expect(repository.insertItem.mock.calls.map((call) => call[1].imageKey)).toEqual([null, null]);
    expect(storage.keys('')).toEqual([]);
  });

  it.each([
    ['a missing or expired upload', () => undefined],
    ['an object over 5 MB', (s: FakeStorage) => uploaded(s, TMP_KEY, 5 * MB + 1)],
    ['an empty object', (s: FakeStorage) => uploaded(s, TMP_KEY, 0)],
    ['a type outside the three', (s: FakeStorage) => uploaded(s, TMP_KEY, MB, 'text/plain')],
  ])('rejects %s with 400 and writes nothing', async (_name, arrange) => {
    const { service, storage, repository } = setup();
    arrange(storage);
    await expect(service.createItem({ ...form, imageKey: TMP_KEY })).rejects.toMatchObject({ status: 400 });
    expect(repository.insertItem).not.toHaveBeenCalled();
    expect(storage.keys('menu/')).toEqual([]);
  });

  it('rejects a tmp/ key we did not issue and a non-tmp key on create', async () => {
    const { service, storage } = setup();
    uploaded(storage, 'tmp/../secret.jpg');
    for (const imageKey of ['tmp/../secret.jpg', 'tmp/plain.jpg', OLD_KEY]) {
      await expect(service.createItem({ ...form, imageKey })).rejects.toMatchObject({ status: 400 });
    }
  });

  it('deletes the copied object when the DB write fails (AC-4)', async () => {
    const { service, storage, repository } = setup();
    uploaded(storage);
    repository.insertItem.mockRejectedValueOnce(new Error('db down'));
    await expect(service.createItem({ ...form, imageKey: TMP_KEY })).rejects.toThrow('db down');
    expect(storage.keys('menu/')).toEqual([]);
    expect(storage.keys('tmp/')).toEqual([TMP_KEY]);
  });

  it('still succeeds when deleting the tmp object fails', async () => {
    const { service, storage } = setup();
    uploaded(storage);
    storage.failRemove = true;
    await expect(service.createItem({ ...form, imageKey: TMP_KEY })).resolves.toBeDefined();
    expect(storage.keys('tmp/')).toEqual([TMP_KEY]);
  });
});

describe('MenuWriteService.updateItem photo', () => {
  const edit = (imageKey?: string | null): UpdateMenuItem => ({
    ...form,
    updatedAt: NOW.toISOString(),
    ...(imageKey === undefined ? {} : { imageKey }),
  });
  const savedKey = (repository: ReturnType<typeof setup>['repository']): string | null | undefined =>
    repository.updateItem.mock.calls[0]?.[1].imageKey;

  it('keeps the photo when imageKey is omitted or is the current key', async () => {
    for (const imageKey of [undefined, OLD_KEY]) {
      const { service, storage, repository } = setup();
      uploaded(storage, OLD_KEY);
      await service.updateItem(ITEM, edit(imageKey));
      expect(savedKey(repository)).toBe(OLD_KEY);
      expect(storage.keys('menu/')).toEqual([OLD_KEY]);
    }
  });

  it('removes the photo on null and deletes the old object after the save', async () => {
    const { service, storage, repository } = setup();
    uploaded(storage, OLD_KEY);
    await service.updateItem(ITEM, edit(null));
    expect(savedKey(repository)).toBeNull();
    expect(storage.keys('menu/')).toEqual([]);
  });

  it('replaces the photo with a new tmp/ upload and deletes both the old and the tmp object', async () => {
    const { service, storage, repository } = setup();
    uploaded(storage, OLD_KEY);
    uploaded(storage);
    await service.updateItem(ITEM, edit(TMP_KEY));
    const key = savedKey(repository) ?? '';
    expect(key).toMatch(new RegExp(`^menu/${ITEM}/`));
    expect(key).not.toBe(OLD_KEY);
    expect(storage.keys('')).toEqual([key]);
  });

  it('rejects any other key with 400 and leaves the photo alone', async () => {
    const { service, storage, repository } = setup();
    uploaded(storage, OLD_KEY);
    await expect(service.updateItem(ITEM, edit(`menu/${CATEGORY}/other.jpg`))).rejects.toMatchObject({ status: 400 });
    expect(repository.updateItem).not.toHaveBeenCalled();
    expect(storage.keys('menu/')).toEqual([OLD_KEY]);
  });

  it('drops the copy when the save is refused as stale, and keeps the old photo', async () => {
    const { service, storage, repository } = setup({ imageKey: OLD_KEY, updatedAt: new Date(NOW.getTime() + 1000) });
    uploaded(storage, OLD_KEY);
    uploaded(storage);
    await expect(service.updateItem(ITEM, edit(TMP_KEY))).rejects.toMatchObject({ status: 409 });
    expect(repository.updateItem).not.toHaveBeenCalled();
    expect(storage.keys('')).toEqual([OLD_KEY, TMP_KEY].sort());
  });
});
