export interface PushData {
  notificationId: string;
  type: string;
  refType: string | null;
  refId: string | null;
}

export interface PushMessage {
  to: string;
  title: string;
  body: string | null;
  data: PushData;
}

export type PushFailure = 'device_not_registered' | 'other';

export type PushTicket =
  | { status: 'ok'; receiptId: string }
  | { status: 'error'; failure: PushFailure; message: string };

export type PushReceipt =
  | { status: 'ok' }
  | { status: 'error'; failure: PushFailure; message: string };

export abstract class PushSender {
  public abstract isValidToken(token: string): boolean;
  /** One ticket per message, same order. */
  public abstract send(messages: PushMessage[]): Promise<PushTicket[]>;
  public abstract receipts(ids: string[]): Promise<Map<string, PushReceipt>>;
}
