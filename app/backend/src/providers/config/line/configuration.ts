import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const LineEnvSchema = z.object({
  LINE_CHANNEL_ID: z.string().min(1),
  LINE_CHANNEL_SECRET: z.string().min(1),
  LINE_CALLBACK_URL: z.string().min(1),
});

function parseLineEnv(source: Record<string, unknown>) {
  const result = LineEnvSchema.safeParse({
    LINE_CHANNEL_ID: source.LINE_CHANNEL_ID,
    LINE_CHANNEL_SECRET: source.LINE_CHANNEL_SECRET,
    LINE_CALLBACK_URL: source.LINE_CALLBACK_URL,
  });
  if (!result.success) {
    throw new Error(
      `Validate line config error: ${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}

export const lineConfiguration = registerAs('line', () => {
  const env = parseLineEnv(process.env);
  return {
    channelId: env.LINE_CHANNEL_ID,
    channelSecret: env.LINE_CHANNEL_SECRET,
    callbackUrl: env.LINE_CALLBACK_URL,
  };
});

export default lineConfiguration;
