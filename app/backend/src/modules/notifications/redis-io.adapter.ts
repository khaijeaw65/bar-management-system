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
      this.staffSocketOptions(options, this.frontendUrl),
    ) as Server;
    server.adapter(createAdapter(this.publisher, this.subscriber));
    return server;
  }

  private staffSocketOptions(
    options: ServerOptions | undefined,
    frontendUrl: string,
  ): ServerOptions {
    return {
      ...options,
      cors: {
        origin: (
          origin: string | undefined,
          callback: (err: Error | null, allow?: boolean) => void,
        ) => {
          if (
            !origin ||
            origin === frontendUrl ||
            (process.env.NODE_ENV !== 'production' &&
              (origin.includes('ngrok') || origin.includes('192.168.')))
          ) {
            callback(null, true);
            return;
          }
          callback(new Error('origin not allowed'));
        },
        credentials: true,
      },
      allowRequest: (request, callback) => {
        allowStaffOrigin(request, frontendUrl, callback);
      },
    } as ServerOptions;
  }
}
