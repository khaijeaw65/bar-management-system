import type { CreateModifierGroup, ModifierGroupAdmin, UpdateModifierGroup } from '@bar/contracts';
import { DomainException } from '../../../common/domain-exception.js';
import type { NotificationsService } from '../../notifications/notifications.service.js';
import type { ModifierGroupRepository } from '../domain/modifier-group.repository.js';
import { ModifierGroupService } from './modifier-group.service.js';

// The transaction itself is covered by the e2e suite; here the decorator only has to call through.
vi.mock('@nestjs-cls/transactional', () => ({
  Transactional: () => () => undefined,
}));

const GROUP = '11111111-1111-4111-8111-111111111111';
const OWN = '22222222-2222-4222-8222-222222222222';
const FOREIGN = '33333333-3333-4333-8333-333333333333';
const ITEM = '44444444-4444-4444-8444-444444444444';

const stored: ModifierGroupAdmin = {
  id: GROUP,
  name: 'ท็อปปิ้ง',
  isRequired: false,
  minSelect: 0,
  maxSelect: 1,
  options: [{ id: OWN, name: 'ชีส', priceDelta: '20.00', isAvailable: true }],
  usedByItems: 0,
};

const form = {
  name: 'ท็อปปิ้ง',
  isRequired: false,
  minSelect: 0,
  maxSelect: 1,
  options: [{ id: OWN, name: 'ชีส', priceDelta: '20.00' }],
} satisfies UpdateModifierGroup;

function setup(linked: string[] = [], locked: string[] | null = [OWN]) {
  const repository = {
    listActive: vi.fn(async () => [stored]),
    findActive: vi.fn(async () => stored),
    lock: vi.fn(async () => locked),
    insert: vi.fn(async () => GROUP),
    update: vi.fn(async () => undefined),
    linkedItemIds: vi.fn(async () => linked),
    archive: vi.fn(async () => undefined),
  };
  const notifications = { emitToStaff: vi.fn() };
  const service = new ModifierGroupService(
    repository as unknown as ModifierGroupRepository,
    notifications as unknown as NotificationsService,
  );
  return { repository, notifications, service };
}

async function failure(promise: Promise<unknown>): Promise<DomainException> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof DomainException) return error;
    throw error;
  }
  throw new Error('expected a DomainException');
}

describe('ModifierGroupService', () => {
  it('creates a group and tells the POS with an empty item list', async () => {
    const { repository, notifications, service } = setup();
    const created = await service.create({ ...form, options: [{ name: 'ชีส', priceDelta: '20.00' }] } as CreateModifierGroup);
    expect(created).toEqual(stored);
    expect(repository.insert).toHaveBeenCalledOnce();
    expect(notifications.emitToStaff).toHaveBeenCalledExactlyOnceWith('menu.changed', { itemIds: [] });
  });

  it('refuses an option id of another group before writing', async () => {
    const { repository, notifications, service } = setup();
    const refused = await failure(service.update(GROUP, { ...form, options: [{ id: FOREIGN, name: 'ชีส', priceDelta: '1.00' }] }));
    expect(refused).toMatchObject({ code: 'VALIDATION_ERROR', status: 400 });
    expect(repository.update).not.toHaveBeenCalled();
    expect(notifications.emitToStaff).not.toHaveBeenCalled();
  });

  it('answers 404 for an archived or unknown group on PATCH and DELETE', async () => {
    const { repository, service } = setup([], null);
    expect(await failure(service.update(GROUP, form))).toMatchObject({ code: 'NOT_FOUND', status: 404 });
    expect(await failure(service.archive(GROUP))).toMatchObject({ code: 'NOT_FOUND', status: 404 });
    expect(repository.archive).not.toHaveBeenCalled();
  });

  it('emits the linked items on an update', async () => {
    const { notifications, service } = setup([ITEM]);
    await service.update(GROUP, form);
    expect(notifications.emitToStaff).toHaveBeenCalledExactlyOnceWith('menu.changed', { itemIds: [ITEM] });
  });

  it('refuses to archive a group a menu item still links, naming the count', async () => {
    const { repository, notifications, service } = setup([ITEM]);
    const refused = await failure(service.archive(GROUP));
    expect(refused).toMatchObject({ code: 'MODIFIER_GROUP_IN_USE', status: 409 });
    expect(refused.message).toContain('1');
    expect(repository.archive).not.toHaveBeenCalled();
    expect(notifications.emitToStaff).not.toHaveBeenCalled();
  });

  it('archives an unlinked group once, never deleting it', async () => {
    const { repository, notifications, service } = setup();
    expect(await service.archive(GROUP)).toEqual({ ok: true });
    expect(repository.archive).toHaveBeenCalledExactlyOnceWith(GROUP);
    expect(repository.lock.mock.invocationCallOrder[0]).toBeLessThan(repository.linkedItemIds.mock.invocationCallOrder[0] ?? 0);
    expect(notifications.emitToStaff).toHaveBeenCalledExactlyOnceWith('menu.changed', { itemIds: [] });
  });
});
