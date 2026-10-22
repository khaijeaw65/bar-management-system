import type { ManualConfirmReason, Payment, PaymentMethod } from "@bar/contracts";

export type CheckoutPhase =
  | { name: "boot" }
  | { name: "choose"; method: PaymentMethod; received: string }
  | { name: "pending"; payment: Payment }
  | { name: "paid"; payment: Payment }
  | { name: "expired"; payment: Payment }
  | { name: "manual"; payment: Payment; reason: ManualConfirmReason | ""; note: string };

export type CheckoutAction =
  | { type: "resume"; payment: Payment }
  | { type: "start" }
  | { type: "method"; method: PaymentMethod }
  | { type: "received"; value: string }
  | { type: "pending"; payment: Payment }
  | { type: "paid"; payment: Payment }
  | { type: "to-choose" }
  | { type: "manual" }
  | { type: "back" }
  | { type: "reason"; reason: ManualConfirmReason }
  | { type: "note"; note: string }
  | { type: "sync"; payment: Payment };

export const bootPhase: CheckoutPhase = { name: "boot" };

function choose(method: PaymentMethod = "promptpay"): CheckoutPhase {
  return { name: "choose", method, received: "" };
}

function fromStatus(payment: Payment): CheckoutPhase {
  if (payment.status === "completed") return { name: "paid", payment };
  if (payment.status === "cancelled" && payment.statusReason === "expired") return { name: "expired", payment };
  if (payment.status === "cancelled") return choose();
  return { name: "pending", payment };
}

export function checkoutPhase(phase: CheckoutPhase, action: CheckoutAction): CheckoutPhase {
  switch (action.type) {
    case "resume":
      return phase.name === "boot" ? { name: "pending", payment: action.payment } : phase;
    case "start":
      return phase.name === "boot" ? choose() : phase;
    case "method":
      return phase.name === "choose" ? { ...phase, method: action.method, received: "" } : phase;
    case "received":
      return phase.name === "choose" ? { ...phase, received: action.value } : phase;
    case "pending":
      return { name: "pending", payment: action.payment };
    case "paid":
      return { name: "paid", payment: action.payment };
    case "to-choose":
      return phase.name === "choose" ? phase : choose();
    case "manual":
      return phase.name === "pending" ? { name: "manual", payment: phase.payment, reason: "", note: "" } : phase;
    case "back":
      return phase.name === "manual" ? { name: "pending", payment: phase.payment } : phase;
    case "reason":
      return phase.name === "manual" ? { ...phase, reason: action.reason, note: action.reason === "other" ? phase.note : "" } : phase;
    case "note":
      return phase.name === "manual" ? { ...phase, note: action.note } : phase;
    case "sync":
      return fromStatus(action.payment);
    default:
      return phase;
  }
}
