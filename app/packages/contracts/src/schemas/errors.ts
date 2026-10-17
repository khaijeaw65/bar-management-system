import { z } from 'zod';

// Generic codes plus IDEMPOTENCY_KEY_REUSED (D3). Later briefs append domain codes.
export const ErrorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
  'IDEMPOTENCY_KEY_REUSED',
  'INVALID_STATE_TRANSITION',
]);

export type ErrorCode = z.infer<typeof ErrorCodeSchema>;
