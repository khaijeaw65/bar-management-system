import type { ErrorCode, PaymentAttempt } from '@bar/contracts';

export type ErrorData =
  | null
  | {
      details: Array<{
        variantId: string;
        reason: 'sold_out' | 'out_of_window';
      }>;
    }
  | { details: PaymentAttempt };

export interface ErrorEnvelope {
  status: number;
  code: ErrorCode;
  message: string | string[];
  data: ErrorData;
}
