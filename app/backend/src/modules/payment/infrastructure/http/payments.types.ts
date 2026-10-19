import type { PaymentMethod } from '@bar/contracts';
import type { Response } from 'express';

export interface CreatePaymentHttp {
  visitId: string;
  body: unknown;
  header: string | undefined;
  response: Response;
}

export interface NewPaymentHttp {
  visitId: string;
  method: PaymentMethod;
  key: string | null;
  hash: string;
  response: Response;
}
