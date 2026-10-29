import { CreatePaymentSchema, MarkPaidSchema, VerifySlipSchema } from './payments.js';
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
        'SLIP_INVALID',
        'SLIP_PENDING',
        'SLIP_SERVICE_UNAVAILABLE',
        'SLIP_WRONG_RECEIVER',
        'SLIP_RECEIVER_UNCLEAR',
        'SLIP_AMOUNT_SHORT',
        'SLIP_ALREADY_USED',
      ]),
    );
  });

  it('accepts one slip field and rejects a bad image', () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]).toString('base64');
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).toString('base64');
    expect(VerifySlipSchema.safeParse({ payload: 'QR' }).success).toBe(true);
    expect(VerifySlipSchema.safeParse({ image: jpeg }).success).toBe(true);
    expect(VerifySlipSchema.safeParse({ image: png }).success).toBe(true);
    expect(VerifySlipSchema.safeParse({}).success).toBe(false);
    expect(VerifySlipSchema.safeParse({ payload: 'QR', image: jpeg }).success).toBe(false);
    expect(VerifySlipSchema.safeParse({ image: Buffer.from('hello').toString('base64') }).success).toBe(false);
    const huge = Buffer.alloc(1_048_577);
    huge[0] = 0xff;
    huge[1] = 0xd8;
    huge[2] = 0xff;
    expect(VerifySlipSchema.safeParse({ image: huge.toString('base64') }).success).toBe(false);
  });
});