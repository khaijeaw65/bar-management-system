import {
  UpdateVenuePaymentSettingsSchema,
  VenuePaymentSettingsSchema,
} from './venue-payment.js';

describe('venue payment settings contracts', () => {
  it('returns a mask and never the raw id', () => {
    expect(
      VenuePaymentSettingsSchema.safeParse({
        paymentMode: 'own_promptpay',
        promptpayIdType: 'mobile',
        promptpayIdMasked: 'XXX-XXX-5678',
      }).success,
    ).toBe(true);
    expect(
      VenuePaymentSettingsSchema.safeParse({
        paymentMode: 'own_promptpay',
        promptpayIdType: null,
        promptpayIdMasked: null,
      }).success,
    ).toBe(true);
    expect(
      VenuePaymentSettingsSchema.safeParse({
        paymentMode: 'own_promptpay',
        promptpayIdType: 'mobile',
        promptpayIdMasked: '0812345678',
      }).success,
    ).toBe(false);
  });

  it('accepts an update body and rejects an unknown type', () => {
    expect(
      UpdateVenuePaymentSettingsSchema.safeParse({
        promptpayId: '081-234-5678',
        promptpayIdType: 'mobile',
      }).success,
    ).toBe(true);
    expect(
      UpdateVenuePaymentSettingsSchema.safeParse({
        promptpayId: '0812345678',
        promptpayIdType: 'phone',
      }).success,
    ).toBe(false);
  });
});
