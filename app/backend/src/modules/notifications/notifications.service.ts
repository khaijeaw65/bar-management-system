import { Injectable } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway.js';

/** The guest socket lives in the Customer module; it registers here so Notifications never imports it. */
export type TabChangedSink = (visitId: string, sessionEnded: boolean) => void;

export type SeatVisitOpenedSink = (tableSeatId: string, visitId: string) => void;

@Injectable()
export class NotificationsService {
  private tabSink: TabChangedSink | null = null;
  private seatSink: SeatVisitOpenedSink | null = null;

  public constructor(
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  public emitToPos(event: string, payload: unknown): void {
    this.notificationsGateway.emitToPos(event, payload);
  }

  public emitToStaff(event: string, payload: unknown): void {
    this.notificationsGateway.emitToStaff(event, payload);
  }

  public registerTabSink(sink: TabChangedSink): void {
    this.tabSink = sink;
  }

  public registerSeatSink(sink: SeatVisitOpenedSink): void {
    this.seatSink = sink;
  }

  /** A visit opened on this seat: phones still browsing it bind without waiting for a refetch. */
  public emitSeatVisitOpened(tableSeatId: string, visitId: string): void {
    this.seatSink?.(tableSeatId, visitId);
  }

  /** Ping the phones on this visit (`tab.changed`); they refetch their tab. A failed emit never fails the write. */
  public emitTabChanged(visitId: string, sessionEnded = false): void {
    this.tabSink?.(visitId, sessionEnded);
  }
}
