export interface BullRedisConnection {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

export function bullConnection(redisUrl: string): BullRedisConnection {
  const url = new URL(redisUrl);
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 6379,
    username: url.username || undefined,
    password: url.password || undefined,
  };
}
