import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import {
  VENUE_SETTINGS_CHANGED,
  type UpdateVenuePaymentSettings,
  type UpdateVenueSettings,
  type VenuePaymentSettings,
  type VenueSettings,
} from '@bar/contracts';
import { CLOCK, type Clock } from '../../../common/clock.js';
import { AuditLogService } from '../../../common/audit/audit-log.service.js';
import type { AuditRecord } from '../../../common/audit/audit-log.types.js';
import { DomainException } from '../../../common/domain-exception.js';
import { hhmm } from '../../../common/time-label.js';
import { NotificationsService } from '../../notifications/notifications.service.js';
import { PaymentGuard } from '../../payment/application/payment-guard.js';
import {
  VENUE_REPOSITORY,
  type BusinessDayRule,
  type LockedVenue,
  type LockedVenueSettings,
  type VenueSettingsPatch,
  type StoredPromptPay,
  type VenuePaymentAccount,
  type VenueRecord,
  type VenueRepository,
} from '../domain/venue.repository.js';
import { maskPromptPayId, normalizePromptPayId } from './promptpay-id.js';
import type { StoredSettings } from './venue-settings.types.js';

@Injectable()
export class VenueSettingsService {
  public constructor(
    @Inject(VENUE_REPOSITORY) private readonly venues: VenueRepository,
    private readonly paymentGuard: PaymentGuard,
    private readonly auditLog: AuditLogService,
    private readonly notifications: NotificationsService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** Cut-off changes apply from the next business day: the day open at the change keeps the old cut-off (BRIEF-035 Q1 A). Held in memory, so a restart applies the new cut-off at once. */
  private previousCutoff: BusinessDayRule['previous'] = null;

  public async get(): Promise<VenueSettings> {
    const venue = await this.requireVenue();
    return {
      name: venue.name,
      slug: venue.slug,
      kitchenDisplayEnabled: venue.kitchenDisplayEnabled,
      businessDayCutoff: hhmm(venue.businessDayCutoff),
      counterQrEnabled: venue.counterQrEnabled,
    };
  }

  public async businessDayRule(): Promise<BusinessDayRule> {
    const venue = await this.requireVenue();
    return { cutoff: hhmm(venue.businessDayCutoff), previous: this.previousCutoff };
  }

  public async updateSettings(input: UpdateVenueSettings): Promise<VenueSettings> {
    const outcome = await this.storeSettings(input);
    // After the commit, so a rolled-back save leaves neither the grace nor a broadcast behind.
    if (outcome.replacedCutoff !== null) {
      this.previousCutoff = { cutoff: outcome.replacedCutoff, changedAt: this.clock.now() };
    }
    if (outcome.updatedAt) {
      this.notifications.emitToStaff(VENUE_SETTINGS_CHANGED, {
        settings: outcome.settings,
        updatedAt: outcome.updatedAt.toISOString(),
      });
    }
    return outcome.settings;
  }

  public async lockedPaymentAccount(): Promise<VenuePaymentAccount> {
    const venue = await this.venues.lockTheVenueShared();
    if (!venue) throw new DomainException('NOT_FOUND', 'ไม่พบร้าน', 404);
    return {
      paymentMode: venue.paymentMode,
      promptpayId: venue.promptpayId,
      promptpayIdType: venue.promptpayIdType,
    };
  }

  public async getPaymentSettings(): Promise<VenuePaymentSettings> {
    return this.present(await this.requireVenue());
  }

  public updatePaymentSettings(input: UpdateVenuePaymentSettings): Promise<VenuePaymentSettings> {
    return this.storePromptPay(normalizePromptPayId(input.promptpayId, input.promptpayIdType));
  }

  @Transactional()
  private async storePromptPay(stored: StoredPromptPay): Promise<VenuePaymentSettings> {
    const venue = await this.lockVenue();
    await this.paymentGuard.assertNoPaymentInFlightForVenue();
    if (this.isSamePromptPay(venue, stored)) return this.present(venue);
    await this.venues.savePromptPay(venue.id, stored);
    await this.auditLog.record(this.changeOf(venue, stored));
    return this.present({ ...venue, ...stored });
  }

  @Transactional()
  private async storeSettings(
    input: UpdateVenueSettings,
  ): Promise<StoredSettings> {
    const venue = await this.venues.lockTheVenueSettings();
    if (!venue) throw new DomainException('NOT_FOUND', 'ไม่พบร้าน', 404);
    const patch = this.changesOf(venue, input);
    if (Object.keys(patch).length === 0) {
      return { settings: await this.get(), updatedAt: null, replacedCutoff: null };
    }
    const updatedAt = await this.venues.saveSettings(venue.id, patch);
    await this.auditLog.record(this.settingsChangeOf(venue, patch));
    const replacedCutoff = patch.businessDayCutoff === undefined ? null : venue.businessDayCutoff;
    return { settings: await this.get(), updatedAt, replacedCutoff };
  }

  private changesOf(venue: LockedVenueSettings, input: UpdateVenueSettings): VenueSettingsPatch {
    const patch: VenueSettingsPatch = {};
    if (input.name !== undefined && input.name !== venue.name) patch.name = input.name;
    if (input.businessDayCutoff !== undefined && input.businessDayCutoff !== venue.businessDayCutoff) {
      patch.businessDayCutoff = input.businessDayCutoff;
    }
    if (
      input.kitchenDisplayEnabled !== undefined &&
      input.kitchenDisplayEnabled !== venue.kitchenDisplayEnabled
    ) {
      patch.kitchenDisplayEnabled = input.kitchenDisplayEnabled;
    }
    if (input.counterQrEnabled !== undefined && input.counterQrEnabled !== venue.counterQrEnabled) {
      patch.counterQrEnabled = input.counterQrEnabled;
    }
    return patch;
  }

  private settingsChangeOf(venue: LockedVenueSettings, patch: VenueSettingsPatch): AuditRecord {
    const columns: Record<keyof VenueSettingsPatch, string> = {
      name: 'name',
      businessDayCutoff: 'business_day_cutoff',
      kitchenDisplayEnabled: 'kitchen_display_enabled',
      counterQrEnabled: 'counter_qr_enabled',
    };
    const changedFields: AuditRecord['changedFields'] = {};
    for (const key of Object.keys(patch) as (keyof VenueSettingsPatch)[]) {
      changedFields[columns[key]] = { from: String(venue[key]), to: String(patch[key]) };
    }
    return { entity: 'venue', entityId: venue.id, action: 'UPDATE', changedFields };
  }

  private async requireVenue(): Promise<VenueRecord> {
    const venue = await this.venues.findTheVenue();
    if (!venue) throw new DomainException('NOT_FOUND', 'ไม่พบร้าน', 404);
    return venue;
  }

  private async lockVenue(): Promise<LockedVenue> {
    const venue = await this.venues.lockTheVenue();
    if (!venue) throw new DomainException('NOT_FOUND', 'ไม่พบร้าน', 404);
    return venue;
  }

  private isSamePromptPay(venue: LockedVenue, stored: StoredPromptPay): boolean {
    return venue.promptpayId === stored.promptpayId && venue.promptpayIdType === stored.promptpayIdType;
  }

  private present(venue: VenuePaymentAccount): VenuePaymentSettings {
    return {
      paymentMode: venue.paymentMode,
      promptpayIdType: venue.promptpayIdType,
      promptpayIdMasked: maskPromptPayId(venue.promptpayId),
    };
  }

  private changeOf(venue: LockedVenue, stored: StoredPromptPay): AuditRecord {
    return {
      entity: 'venue',
      entityId: venue.id,
      action: 'UPDATE',
      changedFields: {
        promptpay_id: {
          from: maskPromptPayId(venue.promptpayId),
          to: maskPromptPayId(stored.promptpayId),
        },
        promptpay_id_type: { from: venue.promptpayIdType, to: stored.promptpayIdType },
      },
    };
  }
}
