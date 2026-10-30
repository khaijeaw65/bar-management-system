import { Redis } from 'ioredis';
import { IAM_VERSION_KEY } from '../modules/iam/application/iam-version.service.js';
import type { BumpIamVersion } from './seed-iam.js';

/** Opens its own Redis connection for the CLI. A Redis outage is a warning: caches expire within 15 minutes anyway. */
export function redisIamBump(): { bump: BumpIamVersion; close: () => Promise<void> } {
  const client = new Redis(process.env.REDIS_URL ?? 'redis://127.0.0.1:6379', {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    connectTimeout: 3_000,
  });
  client.on('error', () => undefined);
  return {
    bump: async () => {
      try {
        await client.incr(IAM_VERSION_KEY);
      } catch (error) {
        console.warn(`could not bump ${IAM_VERSION_KEY} (${String(error)}) — cached permissions may take up to 15 minutes`);
      }
    },
    close: async () => {
      client.disconnect();
    },
  };
}
