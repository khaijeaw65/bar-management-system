import { UnavailableReasonSchema } from "@bar/contracts";
import { z } from "zod";
import { createCart, type CartState } from "@/lib/order/cart";

const lineSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  itemName: z.string(),
  variantId: z.string(),
  variantName: z.string(),
  modifierOptionIds: z.array(z.string()),
  modifierLabel: z.string(),
  orderedByName: z.string().nullable(),
  notes: z.string().nullable(),
  quantity: z.number().int().min(1).max(99),
  unitPrice: z.string(),
  unavailable: UnavailableReasonSchema.nullable(),
});

const storedSchema = z.object({
  idempotencyKey: z.string().min(1),
  nextId: z.number().int().min(1),
  lines: z.array(lineSchema),
});

const keyOf = (sessionId: string): string => `bar.customer.cart.${sessionId}`;

// Every access is guarded: private windows and blocked storage throw, and the cart then lives in memory only.
function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadCart(sessionId: string): CartState {
  const fresh = createCart();
  try {
    const raw = storage()?.getItem(keyOf(sessionId));
    if (!raw) return fresh;
    const parsed = storedSchema.safeParse(JSON.parse(raw));
    return parsed.success ? { ...fresh, ...parsed.data } : fresh;
  } catch {
    return fresh;
  }
}

export function saveCart(sessionId: string, state: CartState): void {
  try {
    const target = storage();
    if (!target) return;
    if (state.lines.length === 0) {
      target.removeItem(keyOf(sessionId));
      return;
    }
    const { idempotencyKey, nextId, lines } = state;
    target.setItem(keyOf(sessionId), JSON.stringify({ idempotencyKey, nextId, lines }));
  } catch {
    // Quota or blocked storage: keep going with the in-memory cart.
  }
}
