import { TransactionHost } from '@nestjs-cls/transactional';
import { VENUE_SETTINGS_CHANGED } from '@bar/contracts';
import type { AuditLogService } from '../../../common/audit/audit-log.service.js';
import type { NotificationsService } from '../../notifications/notifications.service.js';
import type { PaymentGuard } from '../../payment/application/payment-guard.js';
import type { LockedVenueSettings, VenueRecord, VenueRepository } from '../domain/venue.repository.js';
import { VenueSettingsService } from './venue-settings.service.js';

const NOW = new Date('2026-10-22T16:00:00.000Z');

const LOCKED: LockedVenueSettings = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'The Loft Bar',
  kitchenDisplayEnabled: false,
  businessDayCutoff: '06:00',
  counterQrEnabled: false,
};

const RECORD: VenueRecord = {
  name: LOCKED.name,
  slug: 'the-loft',
  kitchenDisplayEnabled: false,
  businessDayCutoff: '06:00:00',
  counterQrEnabled: false,
  paymentMode: 'own_promptpay',
  promptpayId: null,
  promptpayIdType: null,
};

describe('VenueSettingsService cut-off grace', () => {
  let commitFails = false;

  beforeAll(() => {
    new TransactionHost({
      wrapWithTransaction: async (_options: unknown, fn: () => Promise<unknown>) => {
        const result = await fn();
        if (commitFails) throw new Error('commit failed');
        return result;
      },
      getFallbackInstance: () => ({}),
    } as never);
  });

  const venues = {
    findTheVenue: vi.fn(),
    lockTheVenue: vi.fn(),
    lockTheVenueShared: vi.fn(),
    lockTheVenueSettings: vi.fn(),
    saveSettings: vi.fn(),
    savePromptPay: vi.fn(),
  } satisfies VenueRepository;
  const auditLog = { record: vi.fn() };
  const notifications = { emitToStaff: vi.fn(), emitToPos: vi.fn() };

  function service(): VenueSettingsService {
    return new VenueSettingsService(
      venues,
      {} as PaymentGuard,
      auditLog as unknown as AuditLogService,
      notifications as unknown as NotificationsService,
      { now: () => NOW },
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
    commitFails = false;
    venues.lockTheVenueSettings.mockResolvedValue({ ...LOCKED });
    venues.findTheVenue.mockResolvedValue({ ...RECORD });
  });

  it('records the replaced cut-off once the save commits', async () => {
    const settings = service();
    await settings.updateSettings({ businessDayCutoff: '05:00' });

    expect((await settings.businessDayRule()).previous).toEqual({ cutoff: '06:00', changedAt: NOW });
    expect(notifications.emitToStaff).toHaveBeenCalledWith(VENUE_SETTINGS_CHANGED, expect.anything());
  });

  it('leaves the grace and the broadcast untouched when the commit fails', async () => {
    const settings = service();
    commitFails = true;

    await expect(settings.updateSettings({ businessDayCutoff: '05:00' })).rejects.toThrow('commit failed');

    expect((await settings.businessDayRule()).previous).toBeNull();
    expect(notifications.emitToStaff).not.toHaveBeenCalled();
  });

  it('keeps the grace when a save changes other fields only', async () => {
    const settings = service();
    await settings.updateSettings({ kitchenDisplayEnabled: true });

    expect((await settings.businessDayRule()).previous).toBeNull();
  });
});
