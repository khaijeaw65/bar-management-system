import type { PlaceOrderRequest } from '@bar/contracts';

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

export function requestedLines(body: PlaceOrderRequest): RequestedLine[] {
  return body.items.map((item) => ({
    variantId: item.variantId,
    quantity: item.quantity,
    modifierOptionIds: item.modifierOptionIds ?? [],
    orderedByName: blank(item.orderedByName),
    notes: blank(item.notes),
  }));
}

function blank(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
