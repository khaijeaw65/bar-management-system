import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { VenueRecord, VenueRepository } from '../../domain/venue.repository.js';
import { Venue } from './venue.entity.js';

@Injectable()
export class VenueTypeormRepository implements VenueRepository {
  public constructor(
    @InjectRepository(Venue)
    private readonly venues: Repository<Venue>,
  ) {}

  public async findTheVenue(): Promise<VenueRecord | null> {
    const rows = await this.venues.find({
      order: { createdAt: 'ASC' },
      take: 1,
    });
    const venue = rows[0];
    if (!venue) return null;
    return {
      name: venue.name,
      slug: venue.slug,
      kitchenDisplayEnabled: venue.kitchenDisplayEnabled,
      businessDayCutoff: venue.businessDayCutoff,
      counterQrEnabled: venue.counterQrEnabled,
    };
  }
}
