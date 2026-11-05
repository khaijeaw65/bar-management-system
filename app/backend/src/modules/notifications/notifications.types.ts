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

/** The guest socket lives in the Customer module; it registers here so Notifications never imports it. */
export type TabChangedSink = (visitId: string, sessionEnded: boolean) => void;

export type SeatVisitOpenedSink = (tableSeatId: string, visitId: string) => void;


