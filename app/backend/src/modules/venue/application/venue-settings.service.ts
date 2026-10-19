import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import type { UpdateVenuePaymentSettings, VenuePaymentSettings, VenueSettings } from '@bar/contracts';
import { AuditLogService } from '../../../common/audit/audit-log.service.js';
import type { AuditRecord } from '../../../common/audit/audit-log.types.js';
import { DomainException } from '../../../common/domain-exception.js';
import { hhmm } from '../../../common/time-label.js';
import { PaymentGuard } from '../../payment/application/payment-guard.js';
import {
  VENUE_REPOSITORY,
  type LockedVenue,
  type StoredPromptPay,
  type VenuePaymentAccount,
  type VenueRecord,
  type VenueRepository,
} from '../domain/venue.repository.js';
import { maskPromptPayId, normalizePromptPayId } from './promptpay-id.js';

@Injectable()
export class VenueSettingsService {
  public constructor(
    @Inject(VENUE_REPOSITORY) private readonly venues: VenueRepository,
    private readonly paymentGuard: PaymentGuard,
    private readonly auditLog: AuditLogService,
  ) {}

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
