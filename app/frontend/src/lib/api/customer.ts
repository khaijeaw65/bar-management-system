import {
  CustomerMenuSchema,
  CallStaffResultSchema,
  CustomerPlaceOrderResultSchema,
  CustomerSessionSchema,
  CustomerTabSchema,
  type CustomerCallStaff,
  type CustomerPlaceOrder,
} from "@bar/contracts";
import { apiGet, apiPatch, apiPost } from "./client";
import { ApiError } from "./errors";

type ExpiredListener = () => void;

const expiredListeners = new Set<ExpiredListener>();

// The guest cookie lives 1 session (DR-028); any call can find it gone, so one signal serves every screen.
export function onGuestExpired(listener: ExpiredListener): () => void {
  expiredListeners.add(listener);
  return () => {
    expiredListeners.delete(listener);
  };
}

export function notifyGuestExpired(): void {
  for (const listener of expiredListeners) listener();
}

async function guarded<T>(request: Promise<T>): Promise<T> {
  try {
    return await request;
  } catch (error) {
    if (error instanceof ApiError && error.code === "GUEST_SESSION_INVALID") {
      notifyGuestExpired();
    }
    throw error;
  }
}

export function startSession(qrToken: string) {
  return apiPost("/customer/sessions", { qrToken }, CustomerSessionSchema);
}

export function getSession() {
  return guarded(apiGet("/customer/session", CustomerSessionSchema));
}

export function updateSession(displayName: string | null) {
  return guarded(apiPatch("/customer/session", { displayName }, CustomerSessionSchema));
}

export function getMenu() {
  return guarded(apiGet("/customer/menu", CustomerMenuSchema));
}

export function placeOrder(body: CustomerPlaceOrder, idempotencyKey: string) {
  return guarded(apiPost("/customer/orders", body, CustomerPlaceOrderResultSchema, { idempotencyKey }));
}

export function getTab() {
  return guarded(apiGet("/customer/tab", CustomerTabSchema));
}

export function callStaff(body: CustomerCallStaff) {
  return guarded(apiPost("/customer/call-staff", body, CallStaffResultSchema));
}
