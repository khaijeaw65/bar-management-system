import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const PaymentEnvSchema = z.object({
  PAYMENT_QR_TTL_SECONDS: z.coerce.number().int().positive().default(900),
});

function parsePaymentEnv(source: Record<string, unknown>) {
  const raw = source.PAYMENT_QR_TTL_SECONDS;
  const result = PaymentEnvSchema.safeParse({
    PAYMENT_QR_TTL_SECONDS: raw === undefined || raw === '' ? undefined : raw,
  });
  if (!result.success) {
    throw new Error(`Validate payment config error: ${z.prettifyError(result.error)}`);
  }
  return result.data;
}

export const paymentConfiguration = registerAs('payment', () => {
  const env = parsePaymentEnv(process.env);
  return { qrTtlSeconds: env.PAYMENT_QR_TTL_SECONDS };
});

export default paymentConfiguration;
