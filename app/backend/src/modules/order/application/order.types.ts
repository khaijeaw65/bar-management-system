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
