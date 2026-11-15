import type {
  PushMessage,
  PushReceipt,
  PushSender,
  PushTicket,
} from '../src/modules/notifications/application/ports/push-sender.port.js';

/** Port double for e2e: records every send, and each behaviour can be swapped per test. */
export class FakePushSender implements PushSender {
  public readonly sends: PushMessage[][] = [];
  public failSend = false;
  public ticketFor: (message: PushMessage, index: number) => PushTicket = (_message, index) => ({
    status: 'ok',
    receiptId: `receipt-${index}`,
  });
  public receiptResults = new Map<string, PushReceipt>();

  public isValidToken(token: string): boolean {
    return token.startsWith('ExponentPushToken[');
  }

  public async send(messages: PushMessage[]): Promise<PushTicket[]> {
    this.sends.push(messages);
    if (this.failSend) throw new Error('expo unreachable');
    return messages.map((message, index) => this.ticketFor(message, index));
  }

  public async receipts(ids: string[]): Promise<Map<string, PushReceipt>> {
    const found = new Map<string, PushReceipt>();
    for (const id of ids) {
      const receipt = this.receiptResults.get(id);
      if (receipt) found.set(id, receipt);
    }
    return found;
  }
}
