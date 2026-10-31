import type { ErrorCode, IamLockoutData, MenuItem, MissingPermissions, PaymentAttempt, PolicyInUseData } from '@bar/contracts';

export type ErrorData =
  | null
  | {
      details: Array<{
        variantId: string;
        reason: 'sold_out' | 'out_of_window';
      }>;
    }
  | { details: PaymentAttempt }
  | { details: MenuItem }
  | MissingPermissions
  | IamLockoutData
  | PolicyInUseData;

export interface ErrorEnvelope {
  status: number;
  code: ErrorCode;
  message: string | string[];
  data: ErrorData;
}
