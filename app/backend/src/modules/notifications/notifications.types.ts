export type HandshakeNext = (error?: Error) => void;

export type OriginDecision = (
  error: string | null | undefined,
  success: boolean,
) => void;
