export interface IdempotencyBegin {
  scope: string;
  key: string | null;
  hash: string;
}

export interface IdempotencyFinish<T> extends IdempotencyBegin {
  body: T;
}

export type IdempotencyGate<T> =
  | { kind: 'skip' }
  | { kind: 'owned' }
  | { kind: 'replay'; body: T };

export interface StoredIdempotency<T> {
  hash: string;
  body: T | null;
}
