export type HandshakeNext = (error?: Error) => void;

export type OriginDecision = (
  error: string | null | undefined,
  success: boolean,
) => void;

export interface NotifyInput {
  title: string;
  body?: string | null;
  refType?: string | null;
  refId?: string | null;
}

