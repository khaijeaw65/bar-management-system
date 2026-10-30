import { Injectable, Logger } from '@nestjs/common';
import { OnGatewayInit, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { TAB_CHANGED, type TabChangedPayload } from '@bar/contracts';
import type { Namespace, Socket } from 'socket.io';
import { NotificationsService } from '../../../notifications/notifications.service.js';
import { CustomerTabGateway } from '../../application/customer-tab-gateway.js';
import { GuestSessionService } from '../../application/guest-session.service.js';
import { guestCookieFromHeader } from '../http/guest-cookie.js';
import { seatRoom, sessionRoom, visitRoom } from './customer-rooms.js';

/**
 * The guest socket. Its own socket.io path keeps the `Path=/api/customer` cookie on the handshake (DR-028).
 * It sends one ping — `tab.changed` — and never mirrors a staff payload.
 */
@WebSocketGateway({ namespace: '/customer', path: '/api/customer/socket.io' })
@Injectable()
export class CustomerGateway extends CustomerTabGateway implements OnGatewayInit {
  private readonly logger = new Logger(CustomerGateway.name);

  @WebSocketServer()
  public server!: Namespace;

  public constructor(
    private readonly sessions: GuestSessionService,
    private readonly notifications: NotificationsService,
  ) {
    super();
  }

  public afterInit(server: Namespace): void {
    server.use((socket, next) => {
      void this.admit(socket).then(
        () => next(),
        () => next(new Error('unauthorized')),
      );
    });
    this.notifications.registerTabSink((visitId, sessionEnded) => this.emitTabChanged(visitId, sessionEnded));
  }

  public emitTabChanged(visitId: string, sessionEnded: boolean): void {
    const payload: TabChangedPayload = sessionEnded ? { visitId, sessionEnded } : { visitId };
    this.server.to(visitRoom(visitId)).emit(TAB_CHANGED, payload);
  }

  public override async bindSession(sessionId: string, visitId: string): Promise<void> {
    try {
      await this.server.in(sessionRoom(sessionId)).socketsJoin(visitRoom(visitId));
    } catch (error) {
      // The order stands; the phone picks the visit up on its next reconnect.
      this.logger.warn(`bind socket failed: ${error instanceof Error ? error.message : 'error'}`);
    }
  }

  private async admit(socket: Socket): Promise<void> {
    const session = await this.sessions.resolve(guestCookieFromHeader(socket.handshake.headers.cookie));
    await socket.join(sessionRoom(session.id));
    await socket.join(session.visitId ? visitRoom(session.visitId) : seatRoom(session.seat.id));
  }
}
