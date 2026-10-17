import type { INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import type { Redis } from 'ioredis';
import type { Server, ServerOptions } from 'socket.io';
import { allowStaffOrigin } from './staff-origin.js';

export class RedisIoAdapter extends IoAdapter {
  public constructor(
    app: INestApplication,
    private readonly publisher: Redis,
    private readonly subscriber: Redis,
    private readonly frontendUrl: string,
  ) {
    super(app);
  }

  public override createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(
      port,
      staffSocketOptions(options, this.frontendUrl),
    ) as Server;
    server.adapter(createAdapter(this.publisher, this.subscriber));
    return server;
  }
}

function staffSocketOptions(
  options: ServerOptions | undefined,
  frontendUrl: string,
): ServerOptions {
  return {
    ...options,
    cors: { origin: frontendUrl, credentials: true },
    allowRequest: (request, callback) => {
      allowStaffOrigin(request, frontendUrl, callback);
    },
  } as ServerOptions;
}
