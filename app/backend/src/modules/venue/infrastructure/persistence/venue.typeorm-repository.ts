import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import type { EntityManager, Repository } from 'typeorm';
import { hhmm } from '../../../../common/time-label.js';
import type {
  LockedVenue,
  LockedVenueSettings,
  VenueSettingsPatch,
  StoredPromptPay,
  VenueRecord,
  VenueRepository,
} from '../../domain/venue.repository.js';
import { Venue } from './venue.entity.js';

const LOCK_VENUE = `SELECT id FROM venue ORDER BY created_at ASC LIMIT 1 FOR UPDATE`;
const LOCK_VENUE_SHARE = `SELECT id FROM venue ORDER BY created_at ASC LIMIT 1 FOR SHARE`;

@Injectable()
export class VenueTypeormRepository implements VenueRepository {
  public constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {}

  public async findTheVenue(): Promise<VenueRecord | null> {
    const rows = await this.venues.find({ order: { createdAt: 'ASC' }, take: 1 });
    const venue = rows[0];
    if (!venue) return null;
    return this.toRecord(venue);
  }

  public lockTheVenue(): Promise<LockedVenue | null> {
    return this.lockBy(LOCK_VENUE);
  }

  public lockTheVenueShared(): Promise<LockedVenue | null> {
    return this.lockBy(LOCK_VENUE_SHARE);
  }

  public async lockTheVenueSettings(): Promise<LockedVenueSettings | null> {
    const venue = await this.lockedRow(LOCK_VENUE);
    if (!venue) return null;
    return {
      id: venue.id,
      name: venue.name,
      kitchenDisplayEnabled: venue.kitchenDisplayEnabled,
      businessDayCutoff: hhmm(venue.businessDayCutoff),
      counterQrEnabled: venue.counterQrEnabled,
    };
  }

  public async saveSettings(id: string, patch: VenueSettingsPatch): Promise<void> {
    const venue = await this.venues.findOneBy({ id });
    if (!venue) throw new Error('venue row missing');
    Object.assign(venue, patch);
    await this.venues.save(venue);
  }

  public async savePromptPay(id: string, stored: StoredPromptPay): Promise<void> {
    const venue = await this.venues.findOneBy({ id });
    if (!venue) throw new Error('venue row missing');
    venue.promptpayId = stored.promptpayId;
    venue.promptpayIdType = stored.promptpayIdType;
    await this.venues.save(venue);
  }

  private async lockBy(sql: string): Promise<LockedVenue | null> {
    const venue = await this.lockedRow(sql);
    return venue ? this.toLocked(venue) : null;
  }

  private async lockedRow(sql: string): Promise<Venue | null> {
    const locked: unknown = await this.manager.query(sql);
    const id = this.firstId(locked);
    if (!id) return null;
    return this.venues.findOneBy({ id });
  }

  private toRecord(venue: Venue): VenueRecord {
    return {
      name: venue.name,
      slug: venue.slug,
      kitchenDisplayEnabled: venue.kitchenDisplayEnabled,
      businessDayCutoff: venue.businessDayCutoff,
      counterQrEnabled: venue.counterQrEnabled,
      paymentMode: venue.paymentMode,
      promptpayId: venue.promptpayId,
      promptpayIdType: venue.promptpayIdType,
    };
  }

  private toLocked(venue: Venue): LockedVenue {
    return {
      id: venue.id,
      paymentMode: venue.paymentMode,
      promptpayId: venue.promptpayId,
      promptpayIdType: venue.promptpayIdType,
    };
  }

  private firstId(rows: unknown): string | null {
    if (!Array.isArray(rows) || rows.length === 0) return null;
    const id = (rows[0] as Record<string, unknown>).id;
    return typeof id === 'string' ? id : null;
  }

  private get venues(): Repository<Venue> {
    return this.manager.getRepository(Venue);
  }

  private get manager(): EntityManager {
    return this.txHost.tx;
  }
}
