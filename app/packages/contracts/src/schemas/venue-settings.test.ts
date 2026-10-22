import { UpdateVenueSettingsSchema } from './venue-settings.js';

describe('UpdateVenueSettingsSchema', () => {
  it('accepts a partial body and trims the name', () => {
    expect(UpdateVenueSettingsSchema.parse({ name: '  Bar  ' })).toEqual({ name: 'Bar' });
    expect(UpdateVenueSettingsSchema.parse({ kitchenDisplayEnabled: false })).toEqual({
      kitchenDisplayEnabled: false,
    });
  });

  it.each(['25:00', '6:00', '06:60', '24:00', '06:00:00'])('rejects cut-off %s', (value) => {
    expect(UpdateVenueSettingsSchema.safeParse({ businessDayCutoff: value }).success).toBe(false);
  });

  it('accepts the boundary cut-offs', () => {
    expect(UpdateVenueSettingsSchema.safeParse({ businessDayCutoff: '00:00' }).success).toBe(true);
    expect(UpdateVenueSettingsSchema.safeParse({ businessDayCutoff: '23:59' }).success).toBe(true);
  });

  it('rejects an empty body, a blank name and a name over 200 chars', () => {
    expect(UpdateVenueSettingsSchema.safeParse({}).success).toBe(false);
    expect(UpdateVenueSettingsSchema.safeParse({ name: '   ' }).success).toBe(false);
    expect(UpdateVenueSettingsSchema.safeParse({ name: 'ก'.repeat(201) }).success).toBe(false);
  });
});
