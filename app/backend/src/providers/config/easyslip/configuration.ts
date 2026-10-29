import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const DEFAULT_BASE_URL = 'https://api.easyslip.com/v2';

const EasySlipEnvSchema = z.object({
  EASYSLIP_API_KEY: z.string(),
  EASYSLIP_BASE_URL: z.url(),
});

function parseEasySlipEnv(source: Record<string, unknown>) {
  const key = source.EASYSLIP_API_KEY;
  const base = source.EASYSLIP_BASE_URL;
  const result = EasySlipEnvSchema.safeParse({
    EASYSLIP_API_KEY: typeof key === 'string' ? key : '',
    EASYSLIP_BASE_URL: typeof base === 'string' && base.length > 0 ? base : DEFAULT_BASE_URL,
  });
  if (!result.success) {
    throw new Error(`Validate easyslip config error: ${z.prettifyError(result.error)}`);
  }
  return result.data;
}

export const easyslipConfiguration = registerAs('easyslip', () => {
  const env = parseEasySlipEnv(process.env);
  return {
    apiKey: env.EASYSLIP_API_KEY,
    baseUrl: env.EASYSLIP_BASE_URL,
  };
});

export default easyslipConfiguration;
