import type { Notification } from '@bar/contracts';

export const NOTIFICATION_PUSH_QUEUE = 'notification-push';

export const PUSH_SEND_JOB = 'send';
export const PUSH_RECEIPTS_JOB = 'receipts';

/** Expo asks for receipts to be read about 15 minutes after sending. */
export const RECEIPT_DELAY_MS = 15 * 60 * 1000;

export const PUSH_JOB_ATTEMPTS = 3;
export const PUSH_JOB_BACKOFF_MS = 5_000;

export interface RecipientToken {
  staffUserId: string;
  token: string;
}

export interface PushSendJob {
  notifications: Notification[];
}

export interface PushReceiptsJob {
  /** receipt id → the token it was sent to, so a failed receipt can drop that token */
  tokenByReceiptId: Record<string, string>;
}

export type PushJobData = PushSendJob | PushReceiptsJob;
