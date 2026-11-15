import { Injectable } from '@nestjs/common';
import {
  Expo,
  type ExpoPushMessage,
  type ExpoPushReceipt,
  type ExpoPushTicket,
} from 'expo-server-sdk';
import { ExpoConfigService } from '../../../../providers/config/expo/config.service.js';
import type {
  PushFailure,
  PushMessage,
  PushReceipt,
  PushSender,
  PushTicket,
} from '../../application/ports/push-sender.port.js';

const ANDROID_CHANNEL_ID = 'orders';
const DEVICE_NOT_REGISTERED = 'DeviceNotRegistered';

/** The only file that imports `expo-server-sdk` (DR-003 Amendment 2). */
@Injectable()
export class ExpoPushSenderAdapter implements PushSender {
  private readonly client: Expo;

  public constructor(config: ExpoConfigService) {
    this.client = new Expo({ accessToken: config.accessToken });
  }

  public isValidToken(token: string): boolean {
    return Expo.isExpoPushToken(token);
  }

  public async send(messages: PushMessage[]): Promise<PushTicket[]> {
    const chunks = this.client.chunkPushNotifications(messages.map((m) => this.toExpoMessage(m)));
    const tickets: PushTicket[] = [];
    for (const chunk of chunks) {
      const sent = await this.client.sendPushNotificationsAsync(chunk);
      tickets.push(...sent.map((ticket) => this.toTicket(ticket)));
    }
    return tickets;
  }

  public async receipts(ids: string[]): Promise<Map<string, PushReceipt>> {
    const receipts = new Map<string, PushReceipt>();
    for (const chunk of this.client.chunkPushNotificationReceiptIds(ids)) {
      const found = await this.client.getPushNotificationReceiptsAsync(chunk);
      for (const [id, receipt] of Object.entries(found)) {
        receipts.set(id, this.toReceipt(receipt));
      }
    }
    return receipts;
  }

  private toExpoMessage(message: PushMessage): ExpoPushMessage {
    return {
      to: message.to,
      title: message.title,
      body: message.body ?? undefined,
      data: { ...message.data },
      sound: 'default',
      priority: 'high',
      channelId: ANDROID_CHANNEL_ID,
    };
  }

  private toTicket(ticket: ExpoPushTicket): PushTicket {
    if (ticket.status === 'ok') {
      return { status: 'ok', receiptId: ticket.id };
    }
    return { status: 'error', failure: this.toFailure(ticket.details?.error), message: ticket.message };
  }

  private toReceipt(receipt: ExpoPushReceipt): PushReceipt {
    if (receipt.status === 'ok') {
      return { status: 'ok' };
    }
    return { status: 'error', failure: this.toFailure(receipt.details?.error), message: receipt.message };
  }

  private toFailure(error: string | undefined): PushFailure {
    return error === DEVICE_NOT_REGISTERED ? 'device_not_registered' : 'other';
  }
}
