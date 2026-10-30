import {
  UnavailableLineSchema,
  type PlaceOrderRequest,
  type UnavailableLine,
  type UnavailableReason,
} from "@bar/contracts";
import { z } from "zod";
import { ApiError } from "@/lib/api/errors";
import { scaleMoney, sumMoney } from "@/lib/utils/money";
import type { OrderableItem } from "./orderable";

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
  /** Server message of a 429 — informational only, the cart stays editable and the key is kept. */
  rateLimited: string | null;
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
  | { type: "sync"; items: readonly OrderableItem[] }
  | { type: "closed" }
  | { type: "forbidden" }
  | { type: "network" }
  | { type: "reused" }
  | { type: "rateLimited"; message: string }
  | { type: "reset" };

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
    rateLimited: null,
    undo: null,
  };
}

function signature(line: NewLine): string {
  const options = [...line.modifierOptionIds].sort((left, right) => left.localeCompare(right)).join(",");
  return [line.variantId, options, line.orderedByName ?? "", line.notes ?? ""].join("|");
}

export function lineReason(line: CartLine, items: readonly OrderableItem[]): UnavailableReason | null {
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
  if (error.code === "RATE_LIMITED") return { type: "rateLimited", message: error.message };
  if (error.code === "IDEMPOTENCY_KEY_REUSED") return { type: "reused" };
  if (error.code === "ITEM_UNAVAILABLE") {
    const parsed = detailsSchema.safeParse(error.data);
    if (parsed.success) return { type: "unavailable", details: parsed.data.details };
  }
  return { type: "network" };
}

function editsLocked(state: CartState): boolean {
  return state.pending || state.closed || state.notice !== null;
}

function withQuantity(state: CartState, id: string, quantity: number, added: number): CartState {
  return {
    ...state,
    notice: null,
    undo: added > 0 ? { id, quantity: added } : state.undo,
    lines: state.lines.map((line) => (line.id === id ? { ...line, quantity } : line)),
  };
}

function addLine(state: CartState, line: NewLine): CartState {
  if (editsLocked(state)) return state;
  const match = state.lines.find((entry) => !entry.unavailable && signature(entry) === signature(line));
  if (match) {
    const quantity = Math.min(99, match.quantity + line.quantity);
    return withQuantity(state, match.id, quantity, quantity - match.quantity);
  }
  const id = `line-${state.nextId}`;
  return {
    ...state,
    nextId: state.nextId + 1,
    notice: null,
    undo: { id, quantity: line.quantity },
    lines: [...state.lines, { ...line, id, unavailable: null }],
  };
}

function undoAdd(state: CartState): CartState {
  if (!state.undo || editsLocked(state)) return state;
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

function setQuantity(state: CartState, id: string, requested: number): CartState {
  if (editsLocked(state)) return state;
  const quantity = Math.min(99, Math.max(1, requested));
  return {
    ...state,
    undo: null,
    lines: state.lines.map((line) => (line.id === id && !line.unavailable ? { ...line, quantity } : line)),
  };
}

function removeLine(state: CartState, id: string): CartState {
  if (editsLocked(state)) return state;
  return { ...state, undo: null, lines: state.lines.filter((line) => line.id !== id) };
}

function rememberName(state: CartState, raw: string): CartState {
  if (editsLocked(state)) return state;
  const name = raw.trim();
  if (!name || name.length > 30 || state.names.includes(name)) return state;
  return { ...state, names: [...state.names, name] };
}

function flagUnavailable(state: CartState, details: UnavailableLine[]): CartState {
  const reasons = new Map(details.map((detail) => [detail.variantId, detail.reason]));
  return {
    ...state,
    pending: false,
    lines: state.lines.map((line) => {
      const reason = reasons.get(line.variantId);
      return reason ? { ...line, unavailable: reason } : line;
    }),
  };
}

function syncMenu(state: CartState, items: readonly OrderableItem[]): CartState {
  let changed = false;
  const lines = state.lines.map((line) => {
    if (line.unavailable) return line;
    const reason = lineReason(line, items);
    if (!reason) return line;
    changed = true;
    return { ...line, unavailable: reason };
  });
  return changed ? { ...state, lines } : state;
}

function setPending(state: CartState, value: boolean): CartState {
  return { ...state, pending: value, notice: value ? null : state.notice, rateLimited: value ? null : state.rateLimited };
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "add":
      return addLine(state, action.line);
    case "undo":
      return undoAdd(state);
    case "qty":
      return setQuantity(state, action.id, action.quantity);
    case "remove":
      return removeLine(state, action.id);
    case "rememberName":
      return rememberName(state, action.name);
    case "pending":
      return setPending(state, action.value);
    case "unavailable":
      return flagUnavailable(state, action.details);
    case "sync":
      return syncMenu(state, action.items);
    case "closed":
      return { ...state, closed: true, pending: false };
    case "forbidden":
      return { ...state, forbidden: true, pending: false };
    case "network":
      return { ...state, notice: "network", pending: false };
    case "reused":
      return { ...state, notice: "reused", pending: false };
    case "rateLimited":
      return { ...state, rateLimited: action.message, pending: false };
    case "reset":
      return createCart();
    default:
      return state;
  }
}
