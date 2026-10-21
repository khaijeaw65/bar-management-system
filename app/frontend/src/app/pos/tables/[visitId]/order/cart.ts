import {
  UnavailableLineSchema,
  type MenuItem,
  type PlaceOrderRequest,
  type UnavailableLine,
  type UnavailableReason,
} from "@bar/contracts";
import { z } from "zod";
import { ApiError } from "@/lib/api/errors";
import { scaleMoney, sumMoney } from "@/lib/utils/money";

export interface NewLine {
  itemId: string;
  itemName: string;
  variantId: string;
  variantName: string;
  modifierOptionIds: string[];
  modifierLabel: string;
  orderedByName: string | null;
  notes: string | null;
  quantity: number;
  unitPrice: string;
}

export interface CartLine extends NewLine {
  id: string;
  unavailable: UnavailableReason | null;
}

export interface CartState {
  idempotencyKey: string;
  nextId: number;
  lines: CartLine[];
  names: string[];
  pending: boolean;
  closed: boolean;
  forbidden: boolean;
  notice: "network" | "reused" | null;
  undo: { id: string; quantity: number } | null;
}

export type CartAction =
  | { type: "add"; line: NewLine }
  | { type: "undo" }
  | { type: "qty"; id: string; quantity: number }
  | { type: "remove"; id: string }
  | { type: "rememberName"; name: string }
  | { type: "pending"; value: boolean }
  | { type: "unavailable"; details: UnavailableLine[] }
  | { type: "sync"; items: readonly MenuItem[] }
  | { type: "closed" }
  | { type: "forbidden" }
  | { type: "network" }
  | { type: "reused" };

const detailsSchema = z.object({ details: z.array(UnavailableLineSchema) });

export function createCart(): CartState {
  return {
    idempotencyKey: crypto.randomUUID(),
    nextId: 1,
    lines: [],
    names: [],
    pending: false,
    closed: false,
    forbidden: false,
    notice: null,
    undo: null,
  };
}

function signature(line: NewLine): string {
  const options = [...line.modifierOptionIds].sort().join(",");
  return [line.variantId, options, line.orderedByName ?? "", line.notes ?? ""].join("|");
}

export function lineReason(line: CartLine, items: readonly MenuItem[]): UnavailableReason | null {
  const item = items.find((entry) => entry.id === line.itemId);
  if (!item) return null;
  if (!item.availableNow) return item.unavailableReason ?? "sold_out";
  const variant = item.variants.find((entry) => entry.id === line.variantId);
  if (variant && !variant.isAvailable) return "sold_out";
  const options = variant?.modifierGroups.flatMap((group) => group.options) ?? [];
  const blocked = line.modifierOptionIds.some((id) => {
    return options.find((option) => option.id === id)?.isAvailable === false;
  });
  return blocked ? "sold_out" : null;
}

export function orderedLines(lines: readonly CartLine[]): CartLine[] {
  return [...lines.filter((line) => line.unavailable), ...lines.filter((line) => !line.unavailable)];
}

export function previewOf(lines: readonly CartLine[]): { total: string; count: number } {
  const open = lines.filter((line) => !line.unavailable);
  return {
    total: sumMoney(open.map((line) => scaleMoney(line.unitPrice, line.quantity))),
    count: open.reduce((sum, line) => sum + line.quantity, 0),
  };
}

export function placeBody(lines: readonly CartLine[]): PlaceOrderRequest {
  return {
    items: lines
      .filter((line) => !line.unavailable)
      .map((line) => ({
        variantId: line.variantId,
        quantity: line.quantity,
        modifierOptionIds: line.modifierOptionIds,
        orderedByName: line.orderedByName,
        notes: line.notes,
      })),
  };
}

export function sendFailure(error: unknown): CartAction {
  if (!(error instanceof ApiError) || error.status === 0 || error.code === "NETWORK_ERROR") {
    return { type: "network" };
  }
  if (error.status === 403) return { type: "forbidden" };
  if (error.code === "INVALID_STATE_TRANSITION") return { type: "closed" };
  if (error.code === "IDEMPOTENCY_KEY_REUSED") return { type: "reused" };
  if (error.code === "ITEM_UNAVAILABLE") {
    const parsed = detailsSchema.safeParse(error.data);
    if (parsed.success) return { type: "unavailable", details: parsed.data.details };
  }
  return { type: "network" };
}

function withQuantity(state: CartState, id: string, quantity: number, added: number): CartState {
  return {
    ...state,
    notice: null,
    undo: added > 0 ? { id, quantity: added } : state.undo,
    lines: state.lines.map((line) => (line.id === id ? { ...line, quantity } : line)),
  };
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  if (action.type === "add") {
    if (state.pending || state.closed) return state;
    const match = state.lines.find((line) => !line.unavailable && signature(line) === signature(action.line));
    if (match) {
      const quantity = Math.min(99, match.quantity + action.line.quantity);
      return withQuantity(state, match.id, quantity, quantity - match.quantity);
    }
    const id = `line-${state.nextId}`;
    return {
      ...state,
      nextId: state.nextId + 1,
      notice: null,
      undo: { id, quantity: action.line.quantity },
      lines: [...state.lines, { ...action.line, id, unavailable: null }],
    };
  }
  if (action.type === "undo") {
    if (!state.undo || state.pending || state.closed) return state;
    const { id, quantity } = state.undo;
    return {
      ...state,
      undo: null,
      lines: state.lines.flatMap((line) => {
        if (line.id !== id) return [line];
        const next = line.quantity - quantity;
        return next > 0 ? [{ ...line, quantity: next }] : [];
      }),
    };
  }
  if (action.type === "qty") {
    if (state.pending || state.closed) return state;
    const quantity = Math.min(99, Math.max(1, action.quantity));
    return {
      ...state,
      undo: null,
      lines: state.lines.map((line) => (line.id === action.id && !line.unavailable ? { ...line, quantity } : line)),
    };
  }
  if (action.type === "remove") {
    if (state.pending || state.closed) return state;
    return { ...state, undo: null, lines: state.lines.filter((line) => line.id !== action.id) };
  }
  if (action.type === "rememberName") {
    const name = action.name.trim();
    if (!name || name.length > 30 || state.names.includes(name)) return state;
    return { ...state, names: [...state.names, name] };
  }
  if (action.type === "pending") {
    return { ...state, pending: action.value, notice: action.value ? null : state.notice };
  }
  if (action.type === "unavailable") {
    const reasons = new Map(action.details.map((detail) => [detail.variantId, detail.reason]));
    return {
      ...state,
      pending: false,
      lines: state.lines.map((line) => {
        const reason = reasons.get(line.variantId);
        return reason ? { ...line, unavailable: reason } : line;
      }),
    };
  }
  if (action.type === "sync") {
    let changed = false;
    const lines = state.lines.map((line) => {
      if (line.unavailable) return line;
      const reason = lineReason(line, action.items);
      if (!reason) return line;
      changed = true;
      return { ...line, unavailable: reason };
    });
    return changed ? { ...state, lines } : state;
  }
  if (action.type === "closed") return { ...state, closed: true, pending: false };
  if (action.type === "forbidden") return { ...state, forbidden: true, pending: false };
  if (action.type === "network") return { ...state, notice: "network", pending: false };
  return { ...state, idempotencyKey: crypto.randomUUID(), notice: "reused", pending: false };
}
