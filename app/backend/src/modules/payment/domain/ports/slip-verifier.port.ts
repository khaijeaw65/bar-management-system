export type SlipCheck = { payload: string } | { image: string };

export type ReceiverMatch = 'matched' | 'not_matched' | 'unknown';

export type SlipVerifyResult =
  | { kind: 'verified'; transRef: string; amount: string; receiverMatch: ReceiverMatch }
  | { kind: 'invalid' }
  | { kind: 'pending' }
  | { kind: 'unavailable' };

export interface SlipVerifyContext {
  expectedAmount: string;
}

export interface SlipVerifier {
  verify(input: SlipCheck, context: SlipVerifyContext): Promise<SlipVerifyResult>;
}

export const SLIP_VERIFIER = Symbol('SLIP_VERIFIER');
