import { Inject, Injectable } from '@nestjs/common';
import type { VenueSettings } from '@bar/contracts';
import { hhmm } from '../../../common/time-label.js';
import { DomainException } from '../../../common/domain-exception.js';
import {
  VENUE_REPOSITORY,
  type VenueRepository,
} from '../domain/venue.repository.js';

@Injectable()
export class VenueSettingsService {
  public constructor(
    @Inject(VENUE_REPOSITORY)
    private readonly venues: VenueRepository,
  ) {}

  public async get(): Promise<VenueSettings> {
    const venue = await this.venues.findTheVenue();
    if (!venue) throw new DomainException('NOT_FOUND', 'ไม่พบร้าน', 404);
    return {
      name: venue.name,
      slug: venue.slug,
      kitchenDisplayEnabled: venue.kitchenDisplayEnabled,
      businessDayCutoff: hhmm(venue.businessDayCutoff),
      counterQrEnabled: venue.counterQrEnabled,
    };
  }
}
