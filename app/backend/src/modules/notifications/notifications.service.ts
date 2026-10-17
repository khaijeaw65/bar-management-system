import { Injectable } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway.js';

@Injectable()
export class NotificationsService {
  public constructor(
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  public emitToPos(event: string, payload: unknown): void {
    this.notificationsGateway.emitToPos(event, payload);
  }

  public emitToStaff(event: string, payload: unknown): void {
    this.notificationsGateway.emitToStaff(event, payload);
  }
}
