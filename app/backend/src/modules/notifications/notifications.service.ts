import { Injectable } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway.js';

@Injectable()
export class NotificationsService {
  public constructor(private readonly gateway: NotificationsGateway) {}

  public emitToPos(event: string, payload: unknown): void {
    this.gateway.emitToPos(event, payload);
  }
}
