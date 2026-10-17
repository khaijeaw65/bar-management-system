import type { ErrorCode } from '@bar/contracts';

export interface ErrorEnvelope {
  status: number;
  code: ErrorCode;
  message: string | string[];
  data: null;
}
