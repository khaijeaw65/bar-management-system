import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { JobsOptions, Queue } from 'bullmq';
import type { Notification } from '@bar/contracts';
import { PushTokenService } from './push-token.service.js';
import {
  PUSH_SENDER,
  type PushMessage,
  type PushSender,
  type PushTicket,
} from './ports/push-sender.port.js';
import {
  NOTIFICATION_PUSH_QUEUE,
  PUSH_JOB_ATTEMPTS,
  PUSH_JOB_BACKOFF_MS,
  PUSH_RECEIPTS_JOB,
  PUSH_SEND_JOB,
  RECEIPT_DELAY_MS,
  type PushJobData,
  type PushReceiptsJob,
  type PushSendJob,
  type RecipientToken,
} from './push.types.js';

const RETRY: JobsOptions = {
  attempts: PUSH_JOB_ATTEMPTS,
  backoff: { type: 'exponential', delay: PUSH_JOB_BACKOFF_MS },
};

@Injectable()
export class PushDeliveryService {
  private readonly logger = new Logger(PushDeliveryService.name);

  public constructor(
    @InjectQueue(NOTIFICATION_PUSH_QUEUE) private readonly queue: Queue<PushJobData>,
    private readonly pushTokens: PushTokenService,
    @Inject(PUSH_SENDER) private readonly sender: PushSender,
  ) {}

  public async enqueue(notifications: Notification[]): Promise<void> {
    if (notifications.length === 0) return;
    await this.queue.add(PUSH_SEND_JOB, { notifications }, RETRY);
  }

  public async deliver(job: PushSendJob): Promise<void> {
    const recipients = job.notifications.map((n) => n.recipientId);
    const tokens = await this.pushTokens.findByRecipients(recipients);
    const messages = this.buildMessages(job.notifications, tokens);
    if (messages.length === 0) return;
    const tickets = await this.sender.send(messages);
    await this.settleTickets(messages, tickets);
  }

  public async checkReceipts(job: PushReceiptsJob): Promise<void> {
    const receipts = await this.sender.receipts(Object.keys(job.tokenByReceiptId));
    const dead: string[] = [];
    for (const [receiptId, receipt] of receipts) {
      if (receipt.status === 'ok') continue;
      this.logger.warn(`push receipt ${receiptId} failed: ${receipt.message}`);
      const token = job.tokenByReceiptId[receiptId];
      if (token && receipt.failure === 'device_not_registered') dead.push(token);
    }
    await this.pushTokens.removeTokens(dead);
  }

  private buildMessages(notifications: Notification[], tokens: RecipientToken[]): PushMessage[] {
    return notifications.flatMap((notification) =>
      tokens
        .filter((t) => t.staffUserId === notification.recipientId)
        .map((t) => this.toMessage(notification, t.token)),
    );
  }

  private toMessage(notification: Notification, token: string): PushMessage {
    return {
      to: token,
      title: notification.title,
      body: notification.body,
      data: {
        notificationId: notification.id,
        type: notification.type,
        refType: notification.refType,
        refId: notification.refId,
      },
    };
  }

  private async settleTickets(messages: PushMessage[], tickets: PushTicket[]): Promise<void> {
    const dead: string[] = [];
    const tokenByReceiptId: Record<string, string> = {};
    messages.forEach((message, index) => {
      const ticket = tickets[index];
      if (ticket?.status === 'ok') tokenByReceiptId[ticket.receiptId] = message.to;
      if (ticket?.status !== 'error') return;
      this.logger.warn(`push ticket failed: ${ticket.message}`);
      if (ticket.failure === 'device_not_registered') dead.push(message.to);
    });
    await this.pushTokens.removeTokens(dead);
    await this.scheduleReceiptCheck(tokenByReceiptId);
  }

  private async scheduleReceiptCheck(tokenByReceiptId: Record<string, string>): Promise<void> {
    if (Object.keys(tokenByReceiptId).length === 0) return;
    await this.queue.add(PUSH_RECEIPTS_JOB, { tokenByReceiptId }, { ...RETRY, delay: RECEIPT_DELAY_MS });
  }
}
