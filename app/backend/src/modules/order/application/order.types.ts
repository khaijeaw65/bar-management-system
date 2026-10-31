export interface RequestedLine {
  variantId: string;
  quantity: number;
  modifierOptionIds: string[];
  orderedByName: string | null;
  notes: string | null;
}

export interface PlaceOrderInput {
  visitId: string;
  items: RequestedLine[];
}

export interface VisitBill {
  total: string;
  itemCount: number;
}

/** A guest's order (BRIEF-048). `bindVisit` runs inside the order transaction, right after the visit is resolved. */
export interface GuestOrderInput {
  guestSessionId: string;
  tableSeatId: string;
  /** The session's visit, or null for a seat-only session — the order then opens (or joins) the seat's visit. */
  visitId: string | null;
  items: RequestedLine[];
  bindVisit: (visitId: string) => Promise<void>;
}

export interface PlacedOrder {
  orderId: string;
  activated: boolean;
  opened: boolean;
  visitId: string;
  tableSeatId: string;
}

