import paymentConfiguration from './configuration.js';

describe('payment config', () => {
  it('defaults the QR lifetime to 15 minutes', () => {
    const previous = process.env.PAYMENT_QR_TTL_SECONDS;
    delete process.env.PAYMENT_QR_TTL_SECONDS;
    try {
      expect(paymentConfiguration()).toEqual({ qrTtlSeconds: 900 });
    } finally {
      if (previous === undefined) delete process.env.PAYMENT_QR_TTL_SECONDS;
      else process.env.PAYMENT_QR_TTL_SECONDS = previous;
    }
  });
});
