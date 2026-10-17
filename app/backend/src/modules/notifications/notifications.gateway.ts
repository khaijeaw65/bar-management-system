import { Injectable } from '@nestjs/common';
import {
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';
import { TokenService } from '../auth/application/token.service.js';
import { tokenFromHandshake } from './handshake-token.js';
import type { HandshakeNext } from './notifications.types.js';

@WebSocketGateway({ namespace: '/staff' })
@Injectable()
export class NotificationsGateway implements OnGatewayInit {
  @WebSocketServer()
  public server!: Namespace;

  public constructor(private readonly tokenService: TokenService) {}

  public afterInit(server: Namespace): void {
    server.use((socket, next) => {
      void this.admit(socket, next);
    });
  }

  public emitToPos(event: string, payload: unknown): void {
    this.server.to('pos').emit(event, payload);
  }

  private async admit(socket: Socket, next: HandshakeNext): Promise<void> {
    const admitted = await this.tryJoinPos(socket);
    if (!admitted) {
      next(new Error('unauthorized'));
      return;
    }
    next();
  }

  private async tryJoinPos(socket: Socket): Promise<boolean> {
    try {
      return await this.joinWhenActive(socket);
    } catch {
      return false;
    }
  }

  private async joinWhenActive(socket: Socket): Promise<boolean> {
    const token = tokenFromHandshake(socket);
    if (!token) return false;
    const user = await this.tokenService.authenticateAccessToken(token);
    if (!user) return false;
    await socket.join('pos');
    return true;
  }
}
