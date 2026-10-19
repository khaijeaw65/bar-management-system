import { CreatePaymentSchema, MarkPaidSchema } from './payments.js';
import { ErrorCodeSchema } from './errors.js';

describe('payment contracts', () => {
  it('accepts merge and rejects any other mode', () => {
    expect(CreatePaymentSchema.safeParse({ method: 'cash', mode: 'merge' }).success).toBe(true);
    expect(CreatePaymentSchema.safeParse({ method: 'cash', mode: 'split_equal' }).success).toBe(false);
  });

  it('requires a manual reason, and a note when the reason is other', () => {
    expect(MarkPaidSchema.safeParse({ via: 'manual' }).success).toBe(false);
    expect(MarkPaidSchema.safeParse({ via: 'manual', reason: 'other' }).success).toBe(false);
    expect(MarkPaidSchema.safeParse({ via: 'manual', reason: 'other', note: '  ' }).success).toBe(false);
    expect(
      MarkPaidSchema.safeParse({ via: 'manual', reason: 'direct_transfer' }).success,
    ).toBe(true);
    expect(MarkPaidSchema.safeParse({ via: 'cash' }).success).toBe(true);
  });

  it('adds the payment error codes', () => {
    expect(ErrorCodeSchema.options).toEqual(
      expect.arrayContaining([
        'PAYMENT_IN_FLIGHT',
        'NOTHING_TO_PAY',
        'PAYMENT_MODE_UNAVAILABLE',
        'PROMPTPAY_NOT_SET',
      ]),
    );
  });
});